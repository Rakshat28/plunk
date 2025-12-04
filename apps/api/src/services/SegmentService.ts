import {type Contact, Prisma, type Segment} from '@plunk/db';
import type {FilterCondition, FilterGroup, SegmentFilter} from '@plunk/types';

import {prisma} from '../database/prisma.js';
import {HttpException} from '../exceptions/index.js';

import {EventService} from './EventService.js';
import {NtfyService} from './NtfyService.js';

// Re-export types for use in other services
export type {FilterCondition, FilterGroup, SegmentFilter} from '@plunk/types';

export interface PaginatedContacts {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Convert segment name to a URL-safe slug for event names
 * Example: "VIP Customers" -> "vip-customers"
 */
function slugifySegmentName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export class SegmentService {
  /**
   * Get all segments for a project
   * Uses cached member counts for performance - counts are updated via background job
   */
  public static async list(projectId: string): Promise<Segment[]> {
    return prisma.segment.findMany({
      where: {projectId},
      orderBy: {createdAt: 'desc'},
    });
  }

  /**
   * Get a single segment by ID
   * Uses cached member count for performance - counts are updated via background job
   */
  public static async get(projectId: string, segmentId: string): Promise<Segment> {
    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        projectId,
      },
    });

    if (!segment) {
      throw new HttpException(404, 'Segment not found');
    }

    return segment;
  }

  /**
   * Get contacts that match a segment's condition
   */
  public static async getContacts(
    projectId: string,
    segmentId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedContacts> {
    const segment = await this.get(projectId, segmentId);
    const condition = segment.condition as unknown as FilterCondition;

    const where = this.buildWhereClause(projectId, condition);
    const skip = (page - 1) * pageSize;

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {createdAt: 'desc'},
      }),
      prisma.contact.count({where}),
    ]);

    return {
      contacts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Create a new segment
   */
  public static async create(
    projectId: string,
    data: {
      name: string;
      description?: string;
      condition: FilterCondition;
      trackMembership?: boolean;
    },
  ): Promise<Segment> {
    // Validate condition
    this.validateCondition(data.condition);

    // Compute initial member count
    const where = this.buildWhereClause(projectId, data.condition);
    const memberCount = await prisma.contact.count({where});

    const segment = await prisma.segment.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        condition: data.condition as unknown as Prisma.InputJsonValue,
        trackMembership: data.trackMembership ?? false,
        memberCount,
      },
      include: {
        project: {
          select: {name: true},
        },
      },
    });

    // Notify about segment creation
    await NtfyService.notifySegmentCreated(segment.name, segment.project.name, projectId);

    return segment;
  }

  /**
   * Update a segment
   */
  public static async update(
    projectId: string,
    segmentId: string,
    data: {
      name?: string;
      description?: string;
      condition?: FilterCondition;
      trackMembership?: boolean;
    },
  ): Promise<Segment> {
    // First verify segment exists and belongs to project
    await this.get(projectId, segmentId);

    // Validate condition if provided
    if (data.condition) {
      this.validateCondition(data.condition);
    }

    const updateData: Prisma.SegmentUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.condition !== undefined) {
      updateData.condition = data.condition as unknown as Prisma.InputJsonValue;

      // Recompute member count when condition changes
      const where = this.buildWhereClause(projectId, data.condition);
      updateData.memberCount = await prisma.contact.count({where});
    }
    if (data.trackMembership !== undefined) {
      updateData.trackMembership = data.trackMembership;
    }

    return prisma.segment.update({
      where: {id: segmentId},
      data: updateData,
    });
  }

  /**
   * Delete a segment
   */
  public static async delete(projectId: string, segmentId: string): Promise<void> {
    // First verify segment exists and belongs to project
    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        projectId,
      },
      include: {
        project: {
          select: {name: true},
        },
      },
    });

    if (!segment) {
      throw new HttpException(404, 'Segment not found');
    }

    // Check if segment is used in any active campaigns
    const campaignsUsingSegment = await prisma.campaign.count({
      where: {
        segmentId,
        status: {
          in: ['DRAFT', 'SCHEDULED', 'SENDING'],
        },
      },
    });

    if (campaignsUsingSegment > 0) {
      throw new HttpException(
        409,
        `Cannot delete segment: it is currently used in ${campaignsUsingSegment} active campaign(s). Remove it from campaigns first or wait for them to complete.`,
      );
    }

    await prisma.segment.delete({
      where: {id: segmentId},
    });

    // Notify about segment deletion
    await NtfyService.notifySegmentDeleted(segment.name, segment.project.name, projectId);
  }

  /**
   * Refresh segment member count (for background jobs or manual refresh)
   * This is now the primary way to update segment counts
   */
  public static async refreshMemberCount(projectId: string, segmentId: string): Promise<number> {
    const segment = await this.get(projectId, segmentId);
    const condition = segment.condition as unknown as FilterCondition;
    const where = this.buildWhereClause(projectId, condition);

    const memberCount = await prisma.contact.count({where});

    await prisma.segment.update({
      where: {id: segmentId},
      data: {memberCount},
    });

    return memberCount;
  }

  /**
   * Refresh member counts for all segments in a project
   * Should be called by a background job periodically
   */
  public static async refreshAllMemberCounts(projectId: string): Promise<void> {
    const segments = await prisma.segment.findMany({
      where: {projectId},
      select: {id: true, condition: true},
    });

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 5;
    for (let i = 0; i < segments.length; i += BATCH_SIZE) {
      const batch = segments.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async segment => {
          try {
            const condition = segment.condition as unknown as FilterCondition;
            const where = this.buildWhereClause(projectId, condition);
            const memberCount = await prisma.contact.count({where});

            await prisma.segment.update({
              where: {id: segment.id},
              data: {memberCount},
            });
          } catch (error) {
            console.error(`Failed to update count for segment ${segment.id}:`, error);
          }
        }),
      );
    }
  }

  /**
   * Compute or recompute segment membership for all contacts
   * Now uses cursor-based pagination for memory efficiency with large contact lists
   */
  public static async computeMembership(
    projectId: string,
    segmentId: string,
  ): Promise<{added: number; removed: number; total: number}> {
    const segment = await this.get(projectId, segmentId);

    if (!segment.trackMembership) {
      throw new HttpException(400, 'Segment does not have membership tracking enabled');
    }

    const condition = segment.condition as unknown as FilterCondition;
    const where = this.buildWhereClause(projectId, condition);

    // Get all matching contacts using cursor-based pagination to avoid memory issues
    const BATCH_SIZE = 1000;
    const matchingContactIds = new Set<string>();
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const contacts: {id: string}[] = await prisma.contact.findMany({
        where,
        select: {id: true},
        take: BATCH_SIZE,
        skip: cursor ? 1 : 0,
        cursor: cursor ? {id: cursor} : undefined,
        orderBy: {id: 'asc'},
      });

      contacts.forEach((c: {id: string}) => matchingContactIds.add(c.id));

      if (contacts.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        const lastContact = contacts[contacts.length - 1];
        cursor = lastContact?.id;
      }
    }

    // Get current active memberships using cursor pagination
    const currentMemberIds = new Set<string>();
    cursor = undefined;
    hasMore = true;

    while (hasMore) {
      const memberships: {contactId: string}[] = await prisma.segmentMembership.findMany({
        where: {
          segmentId,
          exitedAt: null,
        },
        select: {contactId: true},
        take: BATCH_SIZE,
        skip: cursor ? 1 : 0,
        cursor: cursor ? {contactId_segmentId: {contactId: cursor, segmentId}} : undefined,
        orderBy: {contactId: 'asc'},
      });

      memberships.forEach((m: {contactId: string}) => currentMemberIds.add(m.contactId));

      if (memberships.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        const lastMembership = memberships[memberships.length - 1];
        cursor = lastMembership?.contactId;
      }
    }

    // Calculate changes
    const toAdd = Array.from(matchingContactIds).filter(id => !currentMemberIds.has(id));
    const toRemove = Array.from(currentMemberIds).filter(id => !matchingContactIds.has(id));

    // Process additions in batches
    const ADD_BATCH_SIZE = 500;
    for (let i = 0; i < toAdd.length; i += ADD_BATCH_SIZE) {
      const batch = toAdd.slice(i, i + ADD_BATCH_SIZE);

      await prisma.segmentMembership.createMany({
        data: batch.map(contactId => ({
          segmentId,
          contactId,
          enteredAt: new Date(),
        })),
        skipDuplicates: true,
      });

      // Create segment-specific entry events for each contact in the batch
      for (const contactId of batch) {
        try {
          // Create a human-readable event name using slugified segment name
          const segmentSlug = slugifySegmentName(segment.name);
          const eventName = `segment.${segmentSlug}.entry`;
          await EventService.trackEvent(projectId, eventName, contactId, undefined, {
            segmentId: segment.id,
            segmentName: segment.name,
          });
        } catch (error) {
          console.error(`[SEGMENT] Failed to track segment entry event for contact ${contactId}:`, error);
        }
      }
    }

    const REMOVE_BATCH_SIZE = 500;
    for (let i = 0; i < toRemove.length; i += REMOVE_BATCH_SIZE) {
      const batch = toRemove.slice(i, i + REMOVE_BATCH_SIZE);

      await prisma.segmentMembership.updateMany({
        where: {
          segmentId,
          contactId: {in: batch},
          exitedAt: null,
        },
        data: {
          exitedAt: new Date(),
        },
      });

      // Create segment-specific exit events for each contact in the batch
      for (const contactId of batch) {
        try {
          // Create a human-readable event name using slugified segment name
          const segmentSlug = slugifySegmentName(segment.name);
          const eventName = `segment.${segmentSlug}.exit`;
          await EventService.trackEvent(projectId, eventName, contactId, undefined, {
            segmentId: segment.id,
            segmentName: segment.name,
          });
        } catch (error) {
          console.error(`[SEGMENT] Failed to track segment exit event for contact ${contactId}:`, error);
        }
      }
    }

    // Update member count on segment
    await prisma.segment.update({
      where: {id: segmentId},
      data: {memberCount: matchingContactIds.size},
    });

    console.log(
      `[SEGMENT] Computed membership for segment ${segmentId}: added ${toAdd.length}, removed ${toRemove.length}, total ${matchingContactIds.size}`,
    );

    return {
      added: toAdd.length,
      removed: toRemove.length,
      total: matchingContactIds.size,
    };
  }

  /**
   * Build a single filter condition
   */
  public static buildFilterCondition(filter: SegmentFilter): Prisma.ContactWhereInput {
    const {field, operator, value, unit} = filter;

    // Handle event-based filters (e.g., "event.upgrade", "event.purchase")
    if (field.startsWith('event.')) {
      const eventName = field.substring(6); // Remove "event." prefix
      return this.buildEventCondition(eventName, operator, value, unit);
    }

    // Handle email activity filters (e.g., "email.opened", "email.clicked")
    if (field.startsWith('email.')) {
      const activity = field.substring(6); // Remove "email." prefix
      return this.buildEmailActivityCondition(activity, operator, value, unit);
    }

    // Handle JSON field paths (e.g., "data.plan")
    if (field.startsWith('data.')) {
      const jsonPath = field.substring(5); // Remove "data." prefix
      return this.buildJsonFieldCondition(jsonPath, operator, value);
    }

    // Handle regular fields
    switch (field) {
      case 'email':
        return this.buildStringFieldCondition('email', operator, value);
      case 'subscribed':
        return this.buildBooleanFieldCondition('subscribed', operator, value);
      case 'createdAt':
      case 'updatedAt':
        return this.buildDateFieldCondition(field, operator, value, unit);
      default:
        throw new HttpException(400, `Unsupported filter field: ${field}`);
    }
  }

  /**
   * Validate segment condition (recursive)
   */
  public static validateCondition(condition: FilterCondition): void {
    if (!condition || typeof condition !== 'object') {
      throw new HttpException(400, 'Condition must be an object');
    }

    if (!condition.logic || !['AND', 'OR'].includes(condition.logic)) {
      throw new HttpException(400, 'Condition logic must be either "AND" or "OR"');
    }

    if (!Array.isArray(condition.groups) || condition.groups.length === 0) {
      throw new HttpException(400, 'Condition must have at least one group');
    }

    for (const group of condition.groups) {
      this.validateGroup(group);
    }
  }

  /**
   * Validate filter group (recursive)
   */
  private static validateGroup(group: FilterGroup): void {
    if (!group || typeof group !== 'object') {
      throw new HttpException(400, 'Group must be an object');
    }

    if (!Array.isArray(group.filters)) {
      throw new HttpException(400, 'Group filters must be an array');
    }

    // Groups can have filters, nested conditions, or both
    const hasFilters = group.filters.length > 0;
    const hasConditions = group.conditions !== undefined;

    if (!hasFilters && !hasConditions) {
      throw new HttpException(400, 'Group must have at least one filter or nested condition');
    }

    // Validate all filters in the group
    for (const filter of group.filters) {
      this.validateFilter(filter);
    }

    // Recursively validate nested conditions
    if (group.conditions) {
      this.validateCondition(group.conditions);
    }
  }

  /**
   * Validate individual filter
   */
  private static validateFilter(filter: SegmentFilter): void {
    if (!filter.field) {
      throw new HttpException(400, 'Filter field is required');
    }

    if (!filter.operator) {
      throw new HttpException(400, 'Filter operator is required');
    }

    const validOperators = [
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
    ];

    if (!validOperators.includes(filter.operator)) {
      throw new HttpException(400, `Invalid operator: ${filter.operator}`);
    }

    // Validate that operators that need a value have one
    const operatorsNeedingValue = [
      'equals',
      'notEquals',
      'contains',
      'notContains',
      'greaterThan',
      'lessThan',
      'greaterThanOrEqual',
      'lessThanOrEqual',
      'within',
      'triggeredWithin',
    ];

    if (operatorsNeedingValue.includes(filter.operator) && filter.value === undefined) {
      throw new HttpException(400, `Operator "${filter.operator}" requires a value`);
    }

    // Validate unit for time-based operators
    if (['within', 'triggeredWithin'].includes(filter.operator) && !filter.unit) {
      throw new HttpException(400, `"${filter.operator}" operator requires a unit (days, hours, or minutes)`);
    }
  }

  /**
   * Build Prisma where clause from filter condition (entry point)
   */
  private static buildWhereClause(projectId: string, condition: FilterCondition): Prisma.ContactWhereInput {
    return {
      projectId,
      ...this.buildConditionClause(condition),
    };
  }

  /**
   * Build Prisma clause from filter condition (recursive)
   */
  public static buildConditionClause(condition: FilterCondition): Prisma.ContactWhereInput {
    const groupClauses = condition.groups.map(group => this.buildGroupClause(group));

    if (condition.logic === 'AND') {
      return {AND: groupClauses};
    } else {
      return {OR: groupClauses};
    }
  }

  /**
   * Build Prisma clause from filter group (recursive)
   */
  private static buildGroupClause(group: FilterGroup): Prisma.ContactWhereInput {
    const clauses: Prisma.ContactWhereInput[] = [];

    // Add filter conditions from this group
    if (group.filters.length > 0) {
      clauses.push(...group.filters.map(filter => this.buildFilterCondition(filter)));
    }

    // Add nested condition if present
    if (group.conditions) {
      clauses.push(this.buildConditionClause(group.conditions));
    }

    // All conditions within a group are combined with AND
    if (clauses.length === 0) {
      return {}; // Empty group returns empty where clause
    }

    if (clauses.length === 1) {
      return clauses[0]!; // Safe to use non-null assertion since we checked length
    }

    return {AND: clauses};
  }

  /**
   * Build condition for JSON fields (stored in contact.data)
   */
  private static buildJsonFieldCondition(jsonPath: string, operator: string, value: unknown): Prisma.ContactWhereInput {
    const path = jsonPath.split('.');

    switch (operator) {
      case 'equals':
        return {data: {path, equals: value as Prisma.InputJsonValue}};
      case 'notEquals':
        return {NOT: {data: {path, equals: value as Prisma.InputJsonValue}}};
      case 'contains':
        return {data: {path, string_contains: String(value)}};
      case 'notContains':
        return {NOT: {data: {path, string_contains: String(value)}}};
      case 'greaterThan':
        return {data: {path, gt: value as Prisma.InputJsonValue}};
      case 'lessThan':
        return {data: {path, lt: value as Prisma.InputJsonValue}};
      case 'greaterThanOrEqual':
        return {data: {path, gte: value as Prisma.InputJsonValue}};
      case 'lessThanOrEqual':
        return {data: {path, lte: value as Prisma.InputJsonValue}};
      case 'exists':
        // Exists = key present with a non-null JSON value (neither DbNull nor JsonNull)
        return {
          NOT: {
            OR: [{data: {path, equals: Prisma.DbNull}}, {data: {path, equals: Prisma.JsonNull}}],
          },
        };
      case 'notExists':
        // Not exists = key is null / missing, represented as either DbNull or JsonNull
        return {
          OR: [{data: {path, equals: Prisma.DbNull}}, {data: {path, equals: Prisma.JsonNull}}],
        };
      default:
        throw new HttpException(400, `Unsupported operator for JSON field: ${operator}`);
    }
  }

  /**
   * Build condition for string fields
   */
  private static buildStringFieldCondition(field: 'email', operator: string, value: unknown): Prisma.ContactWhereInput {
    switch (operator) {
      case 'equals':
        return {[field]: {equals: String(value), mode: 'insensitive'}};
      case 'notEquals':
        return {NOT: {[field]: {equals: String(value), mode: 'insensitive'}}};
      case 'contains':
        return {[field]: {contains: String(value), mode: 'insensitive'}};
      case 'notContains':
        return {NOT: {[field]: {contains: String(value), mode: 'insensitive'}}};
      default:
        throw new HttpException(400, `Unsupported operator for string field: ${operator}`);
    }
  }

  /**
   * Build condition for boolean fields
   */
  private static buildBooleanFieldCondition(
    field: 'subscribed',
    operator: string,
    value: unknown,
  ): Prisma.ContactWhereInput {
    switch (operator) {
      case 'equals':
        return {[field]: value === true};
      case 'notEquals':
        return {[field]: value !== true};
      default:
        throw new HttpException(400, `Unsupported operator for boolean field: ${operator}`);
    }
  }

  /**
   * Build condition for date fields
   */
  private static buildDateFieldCondition(
    field: 'createdAt' | 'updatedAt',
    operator: string,
    value: unknown,
    unit?: 'days' | 'hours' | 'minutes',
  ): Prisma.ContactWhereInput {
    switch (operator) {
      case 'greaterThan':
        return {[field]: {gt: new Date(value as string | number | Date)}};
      case 'lessThan':
        return {[field]: {lt: new Date(value as string | number | Date)}};
      case 'greaterThanOrEqual':
        return {[field]: {gte: new Date(value as string | number | Date)}};
      case 'lessThanOrEqual':
        return {[field]: {lte: new Date(value as string | number | Date)}};
      case 'within': {
        // "within X days/hours/minutes" means in the past X time units
        if (!unit) {
          throw new HttpException(400, 'Unit is required for "within" operator');
        }

        const now = new Date();
        const milliseconds = this.getMilliseconds(value as number, unit);
        const since = new Date(now.getTime() - milliseconds);

        return {[field]: {gte: since}};
      }
      default:
        throw new HttpException(400, `Unsupported operator for date field: ${operator}`);
    }
  }

  /**
   * Convert time value and unit to milliseconds
   */
  private static getMilliseconds(value: number, unit: 'days' | 'hours' | 'minutes'): number {
    switch (unit) {
      case 'days':
        return value * 24 * 60 * 60 * 1000;
      case 'hours':
        return value * 60 * 60 * 1000;
      case 'minutes':
        return value * 60 * 1000;
      default:
        throw new HttpException(400, `Unsupported time unit: ${unit}`);
    }
  }

  /**
   * Build condition for event-based filters
   * Uses Prisma relations to efficiently query contacts who triggered specific events
   */
  private static buildEventCondition(
    eventName: string,
    operator: string,
    value: unknown,
    unit?: 'days' | 'hours' | 'minutes',
  ): Prisma.ContactWhereInput {
    switch (operator) {
      case 'triggered':
        // Contact has triggered this event at any time
        return {
          events: {
            some: {
              name: eventName,
            },
          },
        };

      case 'triggeredWithin': {
        // Contact has triggered this event within the specified timeframe
        if (!unit) {
          throw new HttpException(400, 'Unit is required for "triggeredWithin" operator');
        }

        const now = new Date();
        const milliseconds = this.getMilliseconds(value as number, unit);
        const since = new Date(now.getTime() - milliseconds);

        return {
          events: {
            some: {
              name: eventName,
              createdAt: {
                gte: since,
              },
            },
          },
        };
      }

      case 'notTriggered':
        // Contact has never triggered this event
        return {
          events: {
            none: {
              name: eventName,
            },
          },
        };

      default:
        throw new HttpException(400, `Unsupported operator for event field: ${operator}`);
    }
  }

  /**
   * Build condition for email activity filters
   * Uses Prisma relations to efficiently query contacts based on email engagement
   */
  private static buildEmailActivityCondition(
    activity: string,
    operator: string,
    value: unknown,
    unit?: 'days' | 'hours' | 'minutes',
  ): Prisma.ContactWhereInput {
    // Map activity names to Email model fields
    const fieldMap: Record<string, string> = {
      opened: 'openedAt',
      clicked: 'clickedAt',
      bounced: 'bouncedAt',
      complained: 'complainedAt',
      sent: 'sentAt',
      delivered: 'deliveredAt',
    };

    const field = fieldMap[activity];
    if (!field) {
      throw new HttpException(400, `Unsupported email activity: ${activity}`);
    }

    switch (operator) {
      case 'triggered':
        // Contact has this email activity at any time
        return {
          emails: {
            some: {
              [field]: {
                not: null,
              },
            },
          },
        };

      case 'triggeredWithin': {
        // Contact has this email activity within the specified timeframe
        if (!unit) {
          throw new HttpException(400, 'Unit is required for "triggeredWithin" operator');
        }

        const now = new Date();
        const milliseconds = this.getMilliseconds(value as number, unit);
        const since = new Date(now.getTime() - milliseconds);

        return {
          emails: {
            some: {
              [field]: {
                gte: since,
              },
            },
          },
        };
      }

      case 'notTriggered':
        // Contact has never had this email activity
        return {
          emails: {
            none: {
              [field]: {
                not: null,
              },
            },
          },
        };

      default:
        throw new HttpException(400, `Unsupported operator for email activity field: ${operator}`);
    }
  }
}
