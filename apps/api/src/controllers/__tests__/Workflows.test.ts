import {describe, it, expect, beforeEach} from 'vitest';
import {WorkflowTriggerType} from '@plunk/db';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import {app} from '../../app';
import {JWT_SECRET} from '../../app/constants';
import {factories, getPrismaClient} from '../../../../../test/helpers';
import {EventService} from '../../services/EventService';

describe('Workflows Controller', () => {
  let projectId: string;
  let userId: string;
  let authToken: string;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    const {project, user} = await factories.createUserWithProject();
    projectId = project.id;
    userId = user.id;
    authToken = jwt.sign({userId: user.id, projectId: project.id}, JWT_SECRET);
  });

  // ========================================
  // GET /workflows/fields
  // ========================================
  describe('GET /workflows/fields', () => {
    it('should return contact and event fields', async () => {
      const contact = await factories.createContact({
        projectId,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          plan: 'premium',
        },
      });

      // Create email events with data
      await EventService.trackEvent(projectId, 'email.opened', contact.id, undefined, {
        subject: 'Welcome',
        from: 'hello@example.com',
        openedAt: new Date().toISOString(),
        isFirstOpen: true,
      });

      const response = await request(app)
        .get('/workflows/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.fields).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);

      // Should include standard contact fields
      expect(response.body.fields).toContain('contact.email');
      expect(response.body.fields).toContain('contact.subscribed');

      // Should include custom contact data fields
      expect(response.body.fields).toContain('data.firstName');
      expect(response.body.fields).toContain('data.lastName');
      expect(response.body.fields).toContain('data.plan');

      // Should include event fields
      expect(response.body.fields).toContain('event.subject');
      expect(response.body.fields).toContain('event.from');
      expect(response.body.fields).toContain('event.openedAt');
      expect(response.body.fields).toContain('event.isFirstOpen');
    });

    it('should filter event fields by eventName query param', async () => {
      const contact = await factories.createContact({projectId});

      // Create email.opened events
      await EventService.trackEvent(projectId, 'email.opened', contact.id, undefined, {
        subject: 'Test',
        openedAt: new Date().toISOString(),
        isFirstOpen: true,
      });

      // Create email.clicked events
      await EventService.trackEvent(projectId, 'email.clicked', contact.id, undefined, {
        subject: 'Test',
        link: 'https://example.com',
        clickedAt: new Date().toISOString(),
      });

      // Request fields for email.opened only
      const response = await request(app)
        .get('/workflows/fields')
        .query({eventName: 'email.opened'})
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should include email.opened fields
      expect(response.body.fields).toContain('event.subject');
      expect(response.body.fields).toContain('event.openedAt');
      expect(response.body.fields).toContain('event.isFirstOpen');

      // Should NOT include email.clicked fields
      expect(response.body.fields).not.toContain('event.link');
      expect(response.body.fields).not.toContain('event.clickedAt');
    });

    it('should return fields in sorted order', async () => {
      const contact = await factories.createContact({
        projectId,
        data: {
          zebra: 'last',
          apple: 'first',
        },
      });

      await EventService.trackEvent(projectId, 'test.event', contact.id, undefined, {
        zoo: 'value',
        aardvark: 'value',
      });

      const response = await request(app)
        .get('/workflows/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const fields = response.body.fields as string[];

      // Verify fields are sorted
      const sortedFields = [...fields].sort();
      expect(fields).toEqual(sortedFields);
    });

    it('should return empty event fields when no events exist', async () => {
      const response = await request(app)
        .get('/workflows/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should still have contact fields
      expect(response.body.fields).toContain('contact.email');
      expect(response.body.fields).toContain('contact.subscribed');

      // But no event fields
      const eventFields = response.body.fields.filter((f: string) => f.startsWith('event.'));
      expect(eventFields).toHaveLength(0);
    });

    it('should require authentication', async () => {
      await request(app).get('/workflows/fields').expect(401);
    });

    it('should only return fields for authenticated project', async () => {
      // Create another project with events
      const {project: otherProject} = await factories.createUserWithProject();
      const otherContact = await factories.createContact({projectId: otherProject.id});

      await EventService.trackEvent(otherProject.id, 'other.event', otherContact.id, undefined, {
        secretField: 'secret value',
      });

      // Request fields with our auth token (different project)
      const response = await request(app)
        .get('/workflows/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not include fields from other project
      expect(response.body.fields).not.toContain('event.secretField');
    });

    it('should handle URL encoded event names', async () => {
      const contact = await factories.createContact({projectId});

      await EventService.trackEvent(projectId, 'email.opened', contact.id, undefined, {
        field1: 'value',
      });

      const response = await request(app)
        .get('/workflows/fields')
        .query({eventName: 'email.opened'})
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.fields).toContain('event.field1');
    });
  });

  // ========================================
  // Integration Tests
  // ========================================
  describe('Workflow field discovery integration', () => {
    it('should discover correct fields for email.sent events', async () => {
      const contact = await factories.createContact({projectId});
      const email = await factories.createEmail(projectId, contact.id);

      // Create email.sent event with actual structure
      await EventService.trackEvent(projectId, 'email.sent', contact.id, email.id, {
        subject: 'Welcome Email',
        from: 'hello@example.com',
        fromName: 'Example Team',
        messageId: 'msg-123',
        templateId: 'tpl-456',
        campaignId: null,
        sourceType: 'TRANSACTIONAL',
        sentAt: new Date().toISOString(),
      });

      const response = await request(app)
        .get('/workflows/fields')
        .query({eventName: 'email.sent'})
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.fields).toContain('event.subject');
      expect(response.body.fields).toContain('event.from');
      expect(response.body.fields).toContain('event.fromName');
      expect(response.body.fields).toContain('event.messageId');
      expect(response.body.fields).toContain('event.templateId');
      expect(response.body.fields).toContain('event.sourceType');
      expect(response.body.fields).toContain('event.sentAt');
    });

    it('should discover correct fields for email.opened events', async () => {
      const contact = await factories.createContact({projectId});
      const email = await factories.createEmail(projectId, contact.id);

      await EventService.trackEvent(projectId, 'email.opened', contact.id, email.id, {
        subject: 'Newsletter',
        from: 'news@example.com',
        fromName: 'Newsletter Team',
        messageId: 'msg-456',
        openedAt: new Date().toISOString(),
        opens: 1,
        isFirstOpen: true,
      });

      const response = await request(app)
        .get('/workflows/fields')
        .query({eventName: 'email.opened'})
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.fields).toContain('event.openedAt');
      expect(response.body.fields).toContain('event.opens');
      expect(response.body.fields).toContain('event.isFirstOpen');
    });

    it('should discover correct fields for email.clicked events', async () => {
      const contact = await factories.createContact({projectId});
      const email = await factories.createEmail(projectId, contact.id);

      await EventService.trackEvent(projectId, 'email.clicked', contact.id, email.id, {
        subject: 'Sale Announcement',
        from: 'sales@example.com',
        link: 'https://example.com/sale',
        clickedAt: new Date().toISOString(),
        clicks: 1,
        isFirstClick: true,
      });

      const response = await request(app)
        .get('/workflows/fields')
        .query({eventName: 'email.clicked'})
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.fields).toContain('event.link');
      expect(response.body.fields).toContain('event.clickedAt');
      expect(response.body.fields).toContain('event.clicks');
      expect(response.body.fields).toContain('event.isFirstClick');
    });
  });
});
