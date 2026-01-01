/**
 * Type-safe utilities for working with Prisma JSON fields
 *
 * Prisma's JSON types are intentionally loose to support the dynamic nature of JSON.
 * These helpers provide a safer interface while acknowledging the runtime limitations.
 */

import {Prisma} from '@plunk/db';

/**
 * Safely convert a value to Prisma.InputJsonValue for storing in JSON fields
 *
 * This helper provides better type safety than direct casting while acknowledging
 * that Prisma cannot validate the JSON structure at compile time.
 *
 * @template T - The type being stored (for documentation purposes)
 * @param value - The value to convert to Prisma JSON format
 * @returns The value as Prisma.InputJsonValue
 *
 * @example
 * ```typescript
 * // Filter condition (complex nested object)
 * const condition: FilterCondition = { logic: 'AND', groups: [...] };
 * await prisma.segment.create({
 *   data: {
 *     condition: toPrismaJson(condition)
 *   }
 * });
 *
 * // Simple object
 * const headers = { 'X-Custom': 'value' };
 * await prisma.email.create({
 *   data: {
 *     headers: toPrismaJson(headers)
 *   }
 * });
 * ```
 */
export function toPrismaJson<T>(value: T | null | undefined): Prisma.InputJsonValue {
	// Prisma.InputJsonValue accepts: string | number | boolean | null | JsonObject | JsonArray
	// We trust that T is JSON-serializable at runtime (including null)
	return value as unknown as Prisma.InputJsonValue;
}

/**
 * Safely convert Prisma.JsonValue to a typed value when reading from JSON fields
 *
 * IMPORTANT: This does NOT perform runtime validation. It's a type-safe way to
 * document what type you expect, but the caller must validate if needed.
 *
 * @template T - The expected type
 * @param value - The JSON value from Prisma
 * @returns The value as type T
 *
 * @example
 * ```typescript
 * const segment = await prisma.segment.findUnique({ where: { id } });
 * const condition = fromPrismaJson<FilterCondition>(segment.condition);
 * // condition is now typed as FilterCondition (but not validated)
 * ```
 */
export function fromPrismaJson<T>(value: Prisma.JsonValue): T {
	return value as unknown as T;
}

/**
 * Optional version of fromPrismaJson that handles null/undefined
 *
 * @template T - The expected type
 * @param value - The JSON value from Prisma (may be null/undefined)
 * @returns The value as type T or undefined
 */
export function fromPrismaJsonOptional<T>(value: Prisma.JsonValue | null | undefined): T | undefined {
	if (value === null || value === undefined) {
		return undefined;
	}
	return value as unknown as T;
}
