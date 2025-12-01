import {type Contact, Prisma, type Segment} from '@plunk/db';

import {prisma} from '../database/prisma.js';
import {HttpException} from '../exceptions/index.js';

import {EventService} from './EventService.js';

export interface SegmentFilter {
  field: string; // e.g., "email", "data.plan", "subscribed"
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterThanOrEqual'
    | 'lessThanOrEqual'
    | 'exists'
    | 'notExists'
    | 'within'; // For date ranges
  value?: unknown;
  unit?: 'days' | 'hours' | 'minutes'; // For 'within' operator
}

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
   * Get contacts that match a segment's filters
   */
  public static async getContacts(
    projectId: string,
    segmentId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedContacts> {
    const segment = await this.get(projectId, segmentId);
    const filters = segment.filters as unknown as SegmentFilter[];

    const where = this.buildWhereClause(projectId, filters);
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
      filters: SegmentFilter[];
      trackMembership?: boolean;
    },
  ): Promise<Segment> {
    // Validate filters
    this.validateFilters(data.filters);

    // Compute initial member count
    const where = this.buildWhereClause(projectId, data.filters);
    const memberCount = await prisma.contact.count({where});

    return prisma.segment.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        filters: data.filters as unknown as Prisma.JsonArray,
        trackMembership: data.trackMembership ?? false,
        memberCount,
      },
    });
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
      filters?: SegmentFilter[];
      trackMembership?: boolean;
    },
  ): Promise<Segment> {
    // First verify segment exists and belongs to project
    await this.get(projectId, segmentId);

    // Validate filters if provided
    if (data.filters) {
      this.validateFilters(data.filters);
    }

    const updateData: Prisma.SegmentUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.filters !== undefined) {
      updateData.filters = data.filters as unknown as Prisma.JsonArray;

      // Recompute member count when filters change
      const where = this.buildWhereClause(projectId, data.filters);
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
    await this.get(projectId, segmentId);

    // Check if segment is used in any campaigns
    const campaignsUsingSegment = await prisma.campaign.count({
      where: {
        segmentId,
        status: {
          not: 'SENT', // Allow deletion if all campaigns using it are completed
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
  }

  /**
   * Refresh segment member count (for background jobs or manual refresh)
   * This is now the primary way to update segment counts
   */
  public static async refreshMemberCount(projectId: string, segmentId: string): Promise<number> {
    const segment = await this.get(projectId, segmentId);
    const filters = segment.filters as unknown as SegmentFilter[];
    const where = this.buildWhereClause(projectId, filters);

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
      select: {id: true, filters: true},
    });

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 5;
    for (let i = 0; i < segments.length; i += BATCH_SIZE) {
      const batch = segments.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async segment => {
          try {
            const filters = segment.filters as unknown as SegmentFilter[];
            const where = this.buildWhereClause(projectId, filters);
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

    const filters = segment.filters as unknown as SegmentFilter[];
    const where = this.buildWhereClause(projectId, filters);

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
   * Validate segment filters
   */
  public static validateFilters(filters: SegmentFilter[]): void {
    if (!Array.isArray(filters)) {
      throw new HttpException(400, 'Filters must be an array');
    }

    if (filters.length === 0) {
      throw new HttpException(400, 'At least one filter is required');
    }

    for (const filter of filters) {
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
      ];

      if (operatorsNeedingValue.includes(filter.operator) && filter.value === undefined) {
        throw new HttpException(400, `Operator "${filter.operator}" requires a value`);
      }

      // Validate unit for "within" operator
      if (filter.operator === 'within' && !filter.unit) {
        throw new HttpException(400, '"within" operator requires a unit (days, hours, or minutes)');
      }
    }
  }

  /**
   * Build Prisma where clause from segment filters
   */
  private static buildWhereClause(projectId: string, filters: SegmentFilter[]): Prisma.ContactWhereInput {
    const where: Prisma.ContactWhereInput = {
      projectId,
      AND: filters.map(filter => this.buildFilterCondition(filter)),
    };

    return where;
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
}
