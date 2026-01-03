/**
 * Tax Form Annotation System - Type Exports
 *
 * Central export point for all types, interfaces, and enums.
 * Import from this module to access the complete type system.
 *
 * @module types
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import {
 *   FormBlueprint,
 *   FieldAnnotation,
 *   FieldDataType,
 *   Positioning,
 * } from './types';
 * ```
 */

// Re-export all enums
export * from "./enums";

// Re-export all interfaces
export * from "./interfaces";

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Makes all properties in T deeply partial (optional).
 * Useful for partial updates or configuration overrides.
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes specific properties in T required while keeping others optional.
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extracts the element type from an array type.
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Type guard for checking if a value is a valid FieldDataType.
 */
import { FieldDataType } from "./enums";

export function isFieldDataType(value: unknown): value is FieldDataType {
	return Object.values(FieldDataType).includes(value as FieldDataType);
}

/**
 * JSON-serializable version of a FormBlueprint.
 * Ensures the blueprint can be safely serialized to JSON.
 */
import type { FormBlueprint } from "./interfaces";

export type SerializableFormBlueprint = {
	[K in keyof FormBlueprint]: FormBlueprint[K] extends (
		...args: unknown[]
	) => unknown
		? never
		: FormBlueprint[K];
};

/**
 * Type for JSONPath expressions.
 * Provides a nominal type for better documentation and type safety.
 */
export type JSONPath = string & { readonly __brand: "JSONPath" };

/**
 * Helper to create a branded JSONPath.
 */
export function jsonPath(path: string): JSONPath {
	return path as JSONPath;
}

/**
 * Type for field ID references.
 */
export type FieldId = string & { readonly __brand: "FieldId" };

/**
 * Helper to create a branded FieldId.
 */
export function fieldId(id: string): FieldId {
	return id as FieldId;
}
