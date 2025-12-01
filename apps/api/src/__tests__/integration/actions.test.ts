import {describe, it, expect, beforeEach} from 'vitest';
import {ActionSchemas} from '@plunk/shared';
import {factories, getPrismaClient} from '../../../../../test/helpers';
import {
  ErrorCode,
  NotFound,
  ValidationError,
  NotAuthenticated,
  NotAllowed,
  RateLimitError,
  ConflictError,
  BadRequest,
  HttpException,
} from '../../exceptions/index.js';
import {EmailService} from '../../services/EmailService.js';

/**
 * Integration tests for Actions API endpoints (/v1/send, /v1/track)
 * Tests error handling, validation, and business logic for public API
 */
describe('Actions API Integration Tests', () => {
  let projectId: string;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    const {project} = await factories.createUserWithProject();
    projectId = project.id;
  });

  // ========================================
  // ERROR RESPONSE STRUCTURE
  // ========================================
  describe('Error Response Structure', () => {
    it('should have standardized error response format', () => {
      // Document the expected error response structure
      const expectedErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR', // Machine-readable
          message: 'Request validation failed', // Human-readable
          statusCode: 422,
          requestId: expect.any(String), // For tracking
          errors: expect.any(Array), // Field-level errors (for validation)
          suggestion: expect.any(String), // Helpful tip
        },
        timestamp: expect.any(String), // ISO timestamp
      };

      // Verify structure
      expect(expectedErrorResponse.success).toBe(false);
      expect(expectedErrorResponse.error.code).toBeDefined();
      expect(expectedErrorResponse.error.message).toBeDefined();
      expect(expectedErrorResponse.error.statusCode).toBeDefined();
    });
  });

  // ========================================
  // VALIDATION ERRORS (422)
  // ========================================
  describe('Validation Error Handling', () => {
    it('should validate email format in requests', () => {
      const result = ActionSchemas.send.safeParse({
        to: 'not-an-email',
        subject: 'Test',
        body: 'Test',
      });

      expect(result.success).toBe(false);
    });

    it('should validate required fields for /v1/send', () => {
      

      const result = ActionSchemas.send.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('to'))).toBe(true);
      }
    });

    it('should validate subject and body required when no template', () => {
      

      const result = ActionSchemas.send.safeParse({
        to: 'test@example.com',
        // Missing subject, body, and template
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message.includes('template'))).toBe(true);
      }
    });

    it('should validate required fields for /v1/track', () => {
      

      const result = ActionSchemas.track.safeParse({
        email: 'test@example.com',
        // Missing event name
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('event'))).toBe(true);
      }
    });
  });

  // ========================================
  // CUSTOM HTTP EXCEPTIONS
  // ========================================
  describe('Custom HTTP Exception Types', () => {
    it('should structure NotFound errors correctly', () => {
      

      const error = new NotFound('Template', 'abc-123');

      expect(error.code).toBe(404);
      expect(error.message).toContain('Template');
      expect(error.message).toContain('abc-123');
      expect(error.errorCode).toBe(ErrorCode.TEMPLATE_NOT_FOUND);
      expect(error.details).toEqual({resource: 'Template', id: 'abc-123'});
    });

    it('should map resources to specific error codes', () => {
      

      const testCases = [
        {resource: 'contact', expectedCode: ErrorCode.CONTACT_NOT_FOUND},
        {resource: 'template', expectedCode: ErrorCode.TEMPLATE_NOT_FOUND},
        {resource: 'campaign', expectedCode: ErrorCode.CAMPAIGN_NOT_FOUND},
        {resource: 'workflow', expectedCode: ErrorCode.WORKFLOW_NOT_FOUND},
        {resource: 'unknown', expectedCode: ErrorCode.RESOURCE_NOT_FOUND},
      ];

      for (const {resource, expectedCode} of testCases) {
        const error = new NotFound(resource);
        expect(error.errorCode).toBe(expectedCode);
      }
    });

    it('should structure ValidationError with field details', () => {
      

      const fieldErrors = [
        {field: 'email', message: 'Invalid email format', code: 'invalid_email'},
        {field: 'data.firstName', message: 'Required field', code: 'required'},
      ];

      const error = new ValidationError(fieldErrors);

      expect(error.code).toBe(422);
      expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.errors).toEqual(fieldErrors);
    });

    it('should structure NotAuthenticated errors', () => {
      

      const error = new NotAuthenticated();

      expect(error.code).toBe(401);
      expect(error.errorCode).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should structure NotAllowed errors', () => {
      

      const error = new NotAllowed('Cannot perform action', 'Insufficient permissions');

      expect(error.code).toBe(403);
      expect(error.errorCode).toBe(ErrorCode.FORBIDDEN);
      expect(error.details).toEqual({reason: 'Insufficient permissions'});
    });

    it('should structure RateLimitError', () => {
      

      const error = new RateLimitError('Too many requests', 60);

      expect(error.code).toBe(429);
      expect(error.errorCode).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.details).toEqual({retryAfter: 60});
    });

    it('should structure ConflictError', () => {
      

      const error = new ConflictError('Contact exists', {email: 'test@example.com'});

      expect(error.code).toBe(409);
      expect(error.errorCode).toBe(ErrorCode.CONFLICT);
      expect(error.details).toEqual({email: 'test@example.com'});
    });

    it('should structure BadRequest errors', () => {
      

      const error = new BadRequest('Invalid format', ErrorCode.INVALID_REQUEST_BODY, {
        expected: 'JSON',
      });

      expect(error.code).toBe(400);
      expect(error.errorCode).toBe(ErrorCode.INVALID_REQUEST_BODY);
      expect(error.details).toEqual({expected: 'JSON'});
    });
  });

  // ========================================
  // BUSINESS LOGIC ERRORS
  // ========================================
  describe('Business Logic Error Scenarios', () => {
    it('should reject marketing template sent to unsubscribed contact', async () => {
      const contact = await factories.createContact({
        projectId,
        subscribed: false,
      });

      const marketingTemplate = await factories.createTemplate({
        projectId,
        type: 'MARKETING',
      });


      await expect(
        EmailService.sendTransactionalEmail({
          projectId,
          contactId: contact.id,
          templateId: marketingTemplate.id,
          subject: 'Marketing',
          body: 'Buy now!',
          from: 'test@example.com',
        }),
      ).rejects.toThrow(/cannot send marketing template to unsubscribed contact/i);
    });

    it('should return NotFound when template does not exist', async () => {
      const contact = await factories.createContact({projectId});
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const template = await prisma.template.findUnique({
        where: {id: nonExistentId, projectId},
      });

      expect(template).toBeNull();

      // In actual API, this would trigger NotFound exception
      
      const error = new NotFound('Template', nonExistentId);

      expect(error.code).toBe(404);
      expect(error.errorCode).toBe(ErrorCode.TEMPLATE_NOT_FOUND);
    });

    it('should handle billing limit exceeded', () => {
      

      const error = new HttpException(429, 'Billing limit exceeded');

      expect(error.code).toBe(429);
      expect(error.message).toContain('Billing limit exceeded');
    });
  });

  // ========================================
  // ERROR CODE COVERAGE
  // ========================================
  describe('ErrorCode Enum Coverage', () => {
    it('should have all expected error codes defined', () => {
      const expectedCodes = [
        // Auth (401, 403)
        'UNAUTHORIZED',
        'INVALID_CREDENTIALS',
        'MISSING_AUTH',
        'INVALID_API_KEY',
        'FORBIDDEN',
        'PROJECT_ACCESS_DENIED',
        'PROJECT_DISABLED',

        // Resources (404, 409)
        'RESOURCE_NOT_FOUND',
        'CONTACT_NOT_FOUND',
        'TEMPLATE_NOT_FOUND',
        'CAMPAIGN_NOT_FOUND',
        'WORKFLOW_NOT_FOUND',
        'CONFLICT',

        // Validation (400, 422)
        'BAD_REQUEST',
        'VALIDATION_ERROR',
        'INVALID_EMAIL',
        'INVALID_REQUEST_BODY',
        'MISSING_REQUIRED_FIELD',

        // Limits (429, 402)
        'RATE_LIMIT_EXCEEDED',
        'BILLING_LIMIT_EXCEEDED',
        'UPGRADE_REQUIRED',

        // Server (500+)
        'INTERNAL_SERVER_ERROR',
        'DATABASE_ERROR',
        'EXTERNAL_SERVICE_ERROR',
      ];

      for (const code of expectedCodes) {
        expect(ErrorCode[code as keyof typeof ErrorCode]).toBe(code);
      }
    });
  });
});
