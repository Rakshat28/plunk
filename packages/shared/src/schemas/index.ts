import {CampaignAudienceType, TemplateType, TrackingMode, WorkflowStepType, WorkflowTriggerType} from '@plunk/db';
import {z} from 'zod';

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null(), z.date()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | {[key: string]: Json} | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]));

const uuid = z.string().uuid();
const email = z.string().email();

export const UtilitySchemas = {
  id: z.object({
    id: uuid,
  }),
  email: z.object({
    email,
  }),
  pagination: z.object({
    page: z
      .union([z.number(), z.string()])
      .transform(value => parseInt(value as string, 10))
      .nullish()
      .transform(value => value ?? 1),
    limit: z
      .union([z.number(), z.string()])
      .transform(value => parseInt(value as string, 10))
      .nullish()
      .transform(value => value ?? 20),
    sort: z.enum(['alphabetical', 'latest']).default('latest'),
  }),
  query: z.object({
    query: z.string().min(3),
    filters: z
      .union([z.array(z.string()), z.string()])
      .transform(value => (Array.isArray(value) ? value : value.split('_').filter(Boolean)))
      .optional()
      .default([]),
  }),
} as const;

export const AuthenticationSchemas = {
  login: z.object({
    email,
    password: z.string().min(6),
  }),
  signup: z.object({
    email,
    password: z.string().min(6),
  }),
  resetPassword: z.object({
    email,
  }),
} as const;

export const ProjectSchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
  }),
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    tracking: z.nativeEnum(TrackingMode).optional(),
  }),
} as const;

export const ContactSchemas = {
  create: z.object({
    email,
    subscribed: z.boolean().default(true),
    data: jsonSchema.optional(),
  }),
  bulkAction: z.object({
    contactIds: z.array(uuid).min(1).max(1000),
  }),
} as const;

const segmentFilterSchema = z.object({
  field: z.string().min(1),
  operator: z.enum([
    'equals',
    'notEquals',
    'contains',
    'notContains',
    'greaterThan',
    'lessThan',
    'greaterThanOrEqual',
    'lessThanOrEqual',
    'exists',
    'notExists',
    'within',
    'triggered',
    'triggeredWithin',
    'notTriggered',
  ]),
  value: z.any().optional(),
  unit: z.enum(['days', 'hours', 'minutes']).optional(),
});

type FilterGroup = {
  filters: z.infer<typeof segmentFilterSchema>[];
  conditions?: FilterCondition;
};

type FilterCondition = {
  logic: 'AND' | 'OR';
  groups: FilterGroup[];
};

const filterGroupSchema: z.ZodType<FilterGroup> = z.lazy(() =>
  z.object({
    filters: z.array(segmentFilterSchema),
    conditions: filterConditionSchema.optional(),
  }),
);

const filterConditionSchema: z.ZodType<FilterCondition> = z.lazy(() =>
  z.object({
    logic: z.enum(['AND', 'OR']),
    groups: z.array(filterGroupSchema).min(1),
  }),
);

export const SegmentSchemas = {
  filter: segmentFilterSchema,
  filterGroup: filterGroupSchema,
  filterCondition: filterConditionSchema,
  create: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    condition: filterConditionSchema,
    trackMembership: z.boolean().default(false),
  }),
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    condition: filterConditionSchema.optional(),
    trackMembership: z.boolean().optional(),
  }),
};

export const TemplateSchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
    from: email,
    fromName: z.string().max(100).nullish(),
    replyTo: email.nullish(),
    type: z.nativeEnum(TemplateType).default('MARKETING'),
  }),
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    subject: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    from: email.optional(),
    fromName: z.string().max(100).nullish(),
    replyTo: email.nullish(),
    type: z.nativeEnum(TemplateType).optional(),
  }),
};

export const WorkflowSchemas = {
  create: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    eventName: z.string().min(1),
    allowReentry: z.boolean().optional(),
    enabled: z.boolean().default(false),
  }),
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    triggerType: z.nativeEnum(WorkflowTriggerType).optional(),
    triggerConfig: jsonSchema.optional(),
    enabled: z.boolean().optional(),
  }),
  addStep: z.object({
    type: z.nativeEnum(WorkflowStepType),
    name: z.string().min(1).max(100),
    position: jsonSchema,
    config: jsonSchema,
    templateId: uuid.optional(),
    autoConnect: z.boolean().optional(),
  }),
  updateStep: z.object({
    name: z.string().min(1).max(100).optional(),
    position: jsonSchema.optional(),
    config: jsonSchema.optional(),
    templateId: uuid.optional().nullable(),
  }),
  createTransition: z.object({
    fromStepId: uuid,
    toStepId: uuid,
    condition: jsonSchema.optional(),
    priority: z.number().int().min(0).default(0),
  }),
  startExecution: z.object({
    contactId: uuid,
    context: jsonSchema.optional(),
  }),
};

export const WorkflowStepConfigSchemas = {
  delay: z
    .object({
      amount: z.number().positive(),
      unit: z.enum(['minutes', 'hours', 'days']),
    })
    .refine(
      data => {
        // Max 365 days
        const maxMinutes = 365 * 24 * 60;
        const maxHours = 365 * 24;
        const maxDays = 365;

        if (data.unit === 'minutes') return data.amount <= maxMinutes;
        if (data.unit === 'hours') return data.amount <= maxHours;
        if (data.unit === 'days') return data.amount <= maxDays;
        return true;
      },
      {
        message: 'Delay cannot exceed 365 days',
      },
    ),
  waitForEvent: z.object({
    eventName: z.string().min(1),
    timeout: z.number().positive().max(31536000, 'Timeout cannot exceed 365 days (31,536,000 seconds)').optional(),
  }),
  condition: z.object({
    field: z.string().min(1),
    operator: z.enum([
      'equals',
      'notEquals',
      'contains',
      'notContains',
      'greaterThan',
      'lessThan',
      'greaterThanOrEqual',
      'lessThanOrEqual',
      'exists',
      'notExists',
    ]),
    value: z.any().optional(),
  }),
  webhook: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
    headers: z.record(z.string()).optional(),
    body: jsonSchema.optional(),
  }),
  updateContact: z.object({
    updates: z.record(z.any()),
  }),
};

export const DomainSchemas = {
  create: z.object({
    projectId: uuid,
    domain: z
      .string()
      .min(3)
      .max(253)
      .refine(
        value => {
          // Basic domain validation regex
          const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
          return domainRegex.test(value);
        },
        {
          message: 'Invalid domain format',
        },
      ),
  }),
  projectId: z.object({
    projectId: uuid,
  }),
};

export const CampaignSchemas = {
  create: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
    from: email,
    fromName: z.string().max(100).nullish(),
    replyTo: email.nullish(),
    audienceType: z.nativeEnum(CampaignAudienceType),
    audienceCondition: filterConditionSchema.optional(),
    segmentId: uuid.optional(),
  }),
  schedule: z.object({
    scheduledFor: z.string(),
  }),
  update: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
    from: z.string().optional(),
    fromName: z.string().max(100).nullish(),
    replyTo: z.string().nullish(),
    audienceType: z.nativeEnum(CampaignAudienceType).optional(),
    audienceCondition: filterConditionSchema.optional(),
    segmentId: z.string().optional(),
  }),
  sendTest: z.object({
    email,
  }),
} as const;

export const ActionSchemas = {
  track: z.object({
    event: z.string().min(1),
    email,
    subscribed: z.boolean().optional().default(true),
    data: jsonSchema.optional(),
  }),
  send: z
    .object({
      to: z.union([
        email, // Simple email string (backward compatible)
        z.object({
          // Object with name and email
          name: z.string().optional(),
          email: email,
        }),
        z.array(
          z.union([
            email, // Array of email strings
            z.object({
              // Array of objects with name and email
              name: z.string().optional(),
              email: email,
            }),
          ]),
        ),
      ]),
      subject: z.string().min(1).max(998).optional(),
      body: z.string().min(1).optional(),
      template: uuid.optional(),
      subscribed: z.boolean().optional().default(false),
      name: z.string().optional(),
      from: z.union([
        email, // Simple email string (backward compatible)
        z.object({
          // Object with name and email
          name: z.string().optional(),
          email: email,
        }),
      ]),
      reply: email.optional(),
      headers: z.record(z.string().max(998)).optional(),
      data: jsonSchema.optional(),
      attachments: z
        .array(
          z.object({
            filename: z.string().min(1).max(255),
            content: z.string().min(1), // Base64 encoded file content
            contentType: z.string().min(1).max(255),
          }),
        )
        .max(10) // Maximum 10 attachments per email
        .optional(),
    })
    .refine(data => data.template ?? (data.subject && data.body), {
      message: 'Either template ID or both subject and body are required',
    })
    .refine(
      data => {
        // Validate total attachment size (sum of base64 strings should be reasonable)
        if (!data.attachments || data.attachments.length === 0) {
          return true;
        }
        // Each base64 char = ~0.75 bytes, so 13.3M base64 chars ≈ 10MB actual data
        const totalBase64Length = data.attachments.reduce((sum, att) => sum + att.content.length, 0);
        return totalBase64Length <= 13333333; // ~10MB limit
      },
      {
        message: 'Total attachment size must not exceed 10MB',
      },
    ),
} as const;

export const BillingLimitSchemas = {
  update: z.object({
    workflows: z.coerce.number().int().positive().nullable(),
    campaigns: z.coerce.number().int().positive().nullable(),
    transactional: z.coerce.number().int().positive().nullable(),
  }),
} as const;

export const MembershipSchemas = {
  addMember: z.object({
    email,
    role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  }),
  updateRole: z.object({
    role: z.enum(['ADMIN', 'MEMBER']),
  }),
} as const;
