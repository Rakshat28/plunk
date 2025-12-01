import {describe, it, expect, beforeEach} from 'vitest';
import {ContactService} from '../ContactService';
import {factories, getPrismaClient} from '../../../../../test/helpers';

describe('ContactService - Duplicate Prevention & Data Merging', () => {
  let projectId: string;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    const {project} = await factories.createUserWithProject();
    projectId = project.id;
  });

  describe('Duplicate Email Prevention', () => {
    it('should REJECT creating duplicate email in same project', async () => {
      const email = 'test@example.com';

      await ContactService.create(projectId, {email});

      await expect(ContactService.create(projectId, {email})).rejects.toThrow(/already exists/i);
    });

    it('should ALLOW same email in different projects (multi-tenancy)', async () => {
      const {project: project1} = await factories.createUserWithProject();
      const {project: project2} = await factories.createUserWithProject();

      const email = 'test@example.com';

      const contact1 = await ContactService.create(project1.id, {email});
      const contact2 = await ContactService.create(project2.id, {email});

      expect(contact1.id).not.toBe(contact2.id);
      expect(contact1.email).toBe(email);
      expect(contact2.email).toBe(email);
    });

    it('should REJECT updating contact to duplicate email in same project', async () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      await ContactService.create(projectId, {email: email1});
      const contact2 = await ContactService.create(projectId, {email: email2});

      await expect(ContactService.update(projectId, contact2.id, {email: email1})).rejects.toThrow(/already exists/i);
    });

    it('should ALLOW updating contact to same email (no-op)', async () => {
      const email = 'test@example.com';
      const contact = await ContactService.create(projectId, {email});

      const updated = await ContactService.update(projectId, contact.id, {
        email,
        data: {firstName: 'John'},
      });

      expect(updated.email).toBe(email);
    });

    it('should handle race condition when creating same email simultaneously', async () => {
      const email = 'race@example.com';

      const promises = Array.from({length: 10}, () => ContactService.create(projectId, {email}));

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBe(1);
      expect(failed).toBe(9);

      const contacts = await prisma.contact.findMany({
        where: {projectId, email},
      });
      expect(contacts).toHaveLength(1);
    });
  });

  describe('Upsert Data Merging Logic', () => {
    it('should merge new data with existing data without losing fields', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, {
        firstName: 'John',
        plan: 'free',
        signupDate: '2024-01-01',
      });

      expect(contact.data).toMatchObject({
        firstName: 'John',
        plan: 'free',
        signupDate: '2024-01-01',
      });

      const updated = await ContactService.upsert(projectId, email, {
        lastName: 'Doe',
        company: 'Acme Inc',
      });

      expect(updated.data).toMatchObject({
        firstName: 'John',
        plan: 'free',
        signupDate: '2024-01-01',
        lastName: 'Doe',
        company: 'Acme Inc',
      });
    });

    it('should overwrite existing fields with new values', async () => {
      const email = 'test@example.com';

      await ContactService.upsert(projectId, email, {
        plan: 'free',
        credits: 100,
      });

      const updated = await ContactService.upsert(projectId, email, {
        plan: 'pro',
        credits: 1000,
      });

      expect(updated.data).toMatchObject({
        plan: 'pro',
        credits: 1000,
      });
    });

    it('should NOT persist non-persistent data', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, {
        firstName: 'John',
        tempToken: {value: 'abc123', persistent: false},
        oneTimeCode: {value: '123456', persistent: false},
      });

      expect(contact.data).toHaveProperty('firstName', 'John');
      expect(contact.data).not.toHaveProperty('tempToken');
      expect(contact.data).not.toHaveProperty('oneTimeCode');
    });

    it('should ignore reserved fields (plunk_id, plunk_email)', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, {
        firstName: 'John',
        plunk_id: 'malicious-id',
        plunk_email: 'hacker@evil.com',
      });

      expect(contact.data).toHaveProperty('firstName', 'John');
      expect(contact.data).not.toHaveProperty('plunk_id');
      expect(contact.data).not.toHaveProperty('plunk_email');
    });

    it('should handle null data gracefully', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, undefined);

      expect(contact.email).toBe(email);
    });

    it('should handle empty object data', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, {});

      expect(contact.email).toBe(email);
    });

    it('should update subscription status independently of data', async () => {
      const email = 'test@example.com';

      await ContactService.upsert(projectId, email, {firstName: 'John'}, true);

      const subscribed = await prisma.contact.findFirst({
        where: {projectId, email},
      });
      expect(subscribed?.subscribed).toBe(true);

      await ContactService.upsert(projectId, email, {lastName: 'Doe'}, false);

      const unsubscribed = await prisma.contact.findFirst({
        where: {projectId, email},
      });
      expect(unsubscribed?.subscribed).toBe(false);
      expect(unsubscribed?.data).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
      });
    });
  });

  describe('getMergedData - Template Rendering', () => {
    it('should include reserved plunk_id and plunk_email fields', async () => {
      const contact = await factories.createContact({
        projectId,
        email: 'test@example.com',
      });

      const merged = ContactService.getMergedData(contact);

      expect(merged.plunk_id).toBe(contact.id);
      expect(merged.plunk_email).toBe('test@example.com');
    });

    it('should merge persistent contact data', async () => {
      const contact = await factories.createContact({
        projectId,
        data: {firstName: 'John', plan: 'pro'},
      });

      const merged = ContactService.getMergedData(contact);

      expect(merged.firstName).toBe('John');
      expect(merged.plan).toBe('pro');
    });

    it('should merge temporary (non-persistent) data for rendering', async () => {
      const contact = await factories.createContact({
        projectId,
        data: {firstName: 'John'},
      });

      const temporaryData = {
        resetToken: {value: 'temp123', persistent: false},
        resetUrl: {value: 'https://app.com/reset?token=temp123', persistent: false},
      };

      const merged = ContactService.getMergedData(contact, temporaryData);

      expect(merged.firstName).toBe('John');
      expect(merged.resetToken).toBe('temp123');
      expect(merged.resetUrl).toBe('https://app.com/reset?token=temp123');
    });

    it('should override persistent data with temporary data', async () => {
      const contact = await factories.createContact({
        projectId,
        data: {name: 'Stored Name'},
      });

      const temporaryData = {
        name: 'Override Name',
      };

      const merged = ContactService.getMergedData(contact, temporaryData);

      expect(merged.name).toBe('Override Name');
    });

    it('should not allow overriding reserved fields via temporary data', async () => {
      const contact = await factories.createContact({
        projectId,
        email: 'real@example.com',
      });

      const temporaryData = {
        plunk_id: 'fake-id',
        plunk_email: 'fake@example.com',
      };

      const merged = ContactService.getMergedData(contact, temporaryData);

      expect(merged.plunk_id).toBe(contact.id);
      expect(merged.plunk_email).toBe('real@example.com');
    });
  });

  describe('Data Integrity Edge Cases', () => {
    it('should handle deeply nested object data', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, {
        profile: {
          name: 'John',
          address: {
            city: 'NYC',
            zip: '10001',
          },
        },
      });

      expect(contact.data).toMatchObject({
        profile: {
          name: 'John',
          address: {
            city: 'NYC',
            zip: '10001',
          },
        },
      });
    });

    it('should handle array data', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, {
        tags: ['vip', 'beta-tester', 'early-adopter'],
      });

      expect(contact.data).toMatchObject({
        tags: ['vip', 'beta-tester', 'early-adopter'],
      });
    });

    it('should handle special characters in field names', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, {
        'custom-field': 'value',
        'field.with.dots': 'value2',
        'field with spaces': 'value3',
      });

      expect(contact.data).toHaveProperty('custom-field', 'value');
      expect(contact.data).toHaveProperty('field.with.dots', 'value2');
      expect(contact.data).toHaveProperty('field with spaces', 'value3');
    });

    it('should handle boolean, number, and string values', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, {
        isPremium: true,
        credits: 100,
        name: 'John Doe',
        discount: 0.15,
      });

      expect(contact.data).toMatchObject({
        isPremium: true,
        credits: 100,
        name: 'John Doe',
        discount: 0.15,
      });
    });

    it('should handle null values in data', async () => {
      const email = 'test@example.com';

      const contact = await ContactService.upsert(projectId, email, {
        firstName: 'John',
        middleName: null,
        lastName: 'Doe',
      });

      expect(contact.data).toHaveProperty('firstName', 'John');
      expect(contact.data).toHaveProperty('middleName', null);
      expect(contact.data).toHaveProperty('lastName', 'Doe');
    });
  });

  describe('Contact CRUD Operations', () => {
    it('should find contact by email', async () => {
      const email = 'find@example.com';
      const created = await ContactService.create(projectId, {email});

      const found = await ContactService.findByEmail(projectId, email);

      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(email);
    });

    it('should return null when contact not found by email', async () => {
      const found = await ContactService.findByEmail(projectId, 'nonexistent@example.com');

      expect(found).toBeNull();
    });

    it('should get contact count for project', async () => {
      await factories.createContact({projectId});
      await factories.createContact({projectId});
      await factories.createContact({projectId});

      const count = await ContactService.count(projectId);

      expect(count).toBe(3);
    });

    it('should delete contact', async () => {
      const contact = await factories.createContact({projectId});

      await ContactService.delete(projectId, contact.id);

      const deleted = await prisma.contact.findUnique({
        where: {id: contact.id},
      });

      expect(deleted).toBeNull();
    });

    it('should throw 404 when deleting non-existent contact', async () => {
      await expect(ContactService.delete(projectId, 'non-existent')).rejects.toThrow(/not found/i);
    });

    it('should throw 404 when getting non-existent contact', async () => {
      await expect(ContactService.get(projectId, 'non-existent')).rejects.toThrow(/not found/i);
    });
  });

  describe('Public Contact Operations (Unsubscribe)', () => {
    it('should get contact by ID without project authentication', async () => {
      const contact = await factories.createContact({projectId});

      const fetched = await ContactService.getById(contact.id);

      expect(fetched.id).toBe(contact.id);
      expect(fetched.email).toBe(contact.email);
    });

    it('should subscribe contact', async () => {
      const contact = await factories.createContact({
        projectId,
        subscribed: false,
      });

      await ContactService.subscribe(contact.id);

      const subscribed = await prisma.contact.findUnique({
        where: {id: contact.id},
      });

      expect(subscribed?.subscribed).toBe(true);
    });

    it('should unsubscribe contact', async () => {
      const contact = await factories.createContact({
        projectId,
        subscribed: true,
      });

      await ContactService.unsubscribe(contact.id);

      const unsubscribed = await prisma.contact.findUnique({
        where: {id: contact.id},
      });

      expect(unsubscribed?.subscribed).toBe(false);
    });
  });
});
