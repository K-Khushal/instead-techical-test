/**
 * Tax Form Annotation System - Utility Functions
 *
 * Helper functions for working with form blueprints, including:
 * - JSONPath resolution
 * - Coordinate conversions
 * - Validation helpers
 * - Field lookup utilities
 *
 * @module utils
 * @version 1.0.0
 */

import {
	ComparisonOperator,
	type Condition,
	ConditionalAction,
	type ConditionalLogic,
	CoordinateUnit,
	CurrencyFormat,
	DateFormat,
	type FieldAnnotation,
	type FormattingRules,
	type FormBlueprint,
	LogicalOperator,
	type ValidationRule,
	ValidationSeverity,
	ValidationType,
} from "./types";

// ============================================================================
// JSONPATH RESOLUTION
// ============================================================================

/**
 * Resolves a JSONPath expression against a data object.
 *
 * Supports a subset of JSONPath:
 * - Simple property access: $.property
 * - Nested access: $.parent.child.grandchild
 * - Array indexing: $.array[0]
 * - Wildcard array: $.array[*] (returns all elements)
 *
 * @param path - JSONPath expression starting with $
 * @param data - Data object to query
 * @returns The resolved value, or undefined if path not found
 *
 * @example
 * ```typescript
 * const data = { taxpayer: { firstName: 'John' } };
 * resolveJSONPath('$.taxpayer.firstName', data); // 'John'
 * ```
 */
export function resolveJSONPath(path: string, data: unknown): unknown {
	if (!path.startsWith("$")) {
		throw new Error(`Invalid JSONPath: must start with $. Got: ${path}`);
	}

	// Remove the leading $
	const segments = path
		.slice(1)
		.split(".")
		.filter((s) => s.length > 0);

	let current: unknown = data;

	for (const segment of segments) {
		if (current === null || current === undefined) {
			return undefined;
		}

		// Handle array notation: property[index] or property[*]
		const arrayMatch = segment.match(/^(\w+)\[(\d+|\*)\]$/);

		if (arrayMatch) {
			const [, propName, indexOrWildcard] = arrayMatch;

			// Access the property first
			if (typeof current !== "object") {
				return undefined;
			}
			current = (current as Record<string, unknown>)[propName];

			if (!Array.isArray(current)) {
				return undefined;
			}

			if (indexOrWildcard === "*") {
				// Return all elements
				return current;
			} else {
				// Return specific index
				const index = parseInt(indexOrWildcard, 10);
				current = current[index];
			}
		} else {
			// Simple property access
			if (typeof current !== "object") {
				return undefined;
			}
			current = (current as Record<string, unknown>)[segment];
		}
	}

	return current;
}

/**
 * Sets a value at a JSONPath location in a data object.
 * Creates intermediate objects/arrays as needed.
 *
 * @param path - JSONPath expression
 * @param data - Data object to modify
 * @param value - Value to set
 * @returns The modified data object
 */
export function setJSONPath(
	path: string,
	data: Record<string, unknown>,
	value: unknown,
): Record<string, unknown> {
	if (!path.startsWith("$")) {
		throw new Error(`Invalid JSONPath: must start with $. Got: ${path}`);
	}

	const segments = path
		.slice(1)
		.split(".")
		.filter((s) => s.length > 0);
	let current: Record<string, unknown> = data;

	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i];
		const arrayMatch = segment.match(/^(\w+)\[(\d+)\]$/);

		if (arrayMatch) {
			const [, propName, indexStr] = arrayMatch;
			const index = parseInt(indexStr, 10);

			if (!current[propName]) {
				current[propName] = [];
			}
			const arr = current[propName] as unknown[];
			if (!arr[index]) {
				arr[index] = {};
			}
			current = arr[index] as Record<string, unknown>;
		} else {
			if (!current[segment]) {
				current[segment] = {};
			}
			current = current[segment] as Record<string, unknown>;
		}
	}

	const lastSegment = segments[segments.length - 1];
	current[lastSegment] = value;

	return data;
}

// ============================================================================
// COORDINATE CONVERSIONS
// ============================================================================

/**
 * Converts a value from one coordinate unit to points.
 *
 * @param value - The value to convert
 * @param fromUnit - Source unit
 * @param dpi - DPI for pixel conversions (default 72)
 * @returns Value in points
 */
export function toPoints(
	value: number,
	fromUnit: CoordinateUnit,
	dpi: number = 72,
): number {
	switch (fromUnit) {
		case CoordinateUnit.POINTS:
			return value;
		case CoordinateUnit.PIXELS:
			return value * (72 / dpi);
		case CoordinateUnit.INCHES:
			return value * 72;
		case CoordinateUnit.MILLIMETERS:
			return value * 2.834645669; // 72 / 25.4
		case CoordinateUnit.PERCENTAGE:
			throw new Error("Cannot convert percentage without reference dimensions");
		default:
			throw new Error(`Unknown coordinate unit: ${fromUnit}`);
	}
}

/**
 * Converts a value from points to another coordinate unit.
 *
 * @param points - Value in points
 * @param toUnit - Target unit
 * @param dpi - DPI for pixel conversions (default 72)
 * @returns Converted value
 */
export function fromPoints(
	points: number,
	toUnit: CoordinateUnit,
	dpi: number = 72,
): number {
	switch (toUnit) {
		case CoordinateUnit.POINTS:
			return points;
		case CoordinateUnit.PIXELS:
			return points * (dpi / 72);
		case CoordinateUnit.INCHES:
			return points / 72;
		case CoordinateUnit.MILLIMETERS:
			return points / 2.834645669;
		case CoordinateUnit.PERCENTAGE:
			throw new Error(
				"Cannot convert to percentage without reference dimensions",
			);
		default:
			throw new Error(`Unknown coordinate unit: ${toUnit}`);
	}
}

/**
 * Converts Y coordinate between top-left and bottom-left origins.
 *
 * @param y - Y coordinate
 * @param pageHeight - Height of the page
 * @param fieldHeight - Height of the field (optional)
 * @returns Converted Y coordinate
 */
export function convertYOrigin(
	y: number,
	pageHeight: number,
	fieldHeight: number = 0,
): number {
	return pageHeight - y - fieldHeight;
}

// ============================================================================
// FIELD UTILITIES
// ============================================================================

/**
 * Finds a field by ID across all pages in a blueprint.
 *
 * @param blueprint - The form blueprint
 * @param fieldId - ID of the field to find
 * @returns The field annotation, or undefined if not found
 */
export function findFieldById(
	blueprint: FormBlueprint,
	fieldId: string,
): FieldAnnotation | undefined {
	for (const page of blueprint.pages) {
		const field = page.fields.find((f) => f.id === fieldId);
		if (field) {
			return field;
		}
	}
	return undefined;
}

/**
 * Gets all fields belonging to a specific group.
 *
 * @param blueprint - The form blueprint
 * @param groupId - ID of the field group
 * @returns Array of field annotations
 */
export function getFieldsByGroup(
	blueprint: FormBlueprint,
	groupId: string,
): FieldAnnotation[] {
	const fields: FieldAnnotation[] = [];

	for (const page of blueprint.pages) {
		for (const field of page.fields) {
			if (field.groupId === groupId) {
				fields.push(field);
			}
		}
	}

	return fields;
}

/**
 * Gets all fields on a specific page.
 *
 * @param blueprint - The form blueprint
 * @param pageNumber - Page number (1-indexed)
 * @returns Array of field annotations
 */
export function getFieldsByPage(
	blueprint: FormBlueprint,
	pageNumber: number,
): FieldAnnotation[] {
	const page = blueprint.pages.find((p) => p.pageNumber === pageNumber);
	return page ? page.fields : [];
}

/**
 * Gets merged formatting rules for a field, applying:
 * 1. Global styles
 * 2. Type-specific defaults
 * 3. Style preset (if specified)
 * 4. Field-specific formatting
 *
 * @param blueprint - The form blueprint
 * @param field - The field annotation
 * @returns Merged formatting rules
 */
export function getMergedFormatting(
	blueprint: FormBlueprint,
	field: FieldAnnotation,
): FormattingRules {
	let merged: FormattingRules = {};

	// 1. Apply global styles
	if (blueprint.globalStyles) {
		merged = { ...blueprint.globalStyles };
		delete (merged as Record<string, unknown>).typeDefaults;
	}

	// 2. Apply type-specific defaults
	if (blueprint.globalStyles?.typeDefaults?.[field.dataType]) {
		merged = {
			...merged,
			...blueprint.globalStyles.typeDefaults[field.dataType],
		};
	}

	// 3. Apply style preset
	if (field.stylePreset && blueprint.stylePresets?.[field.stylePreset]) {
		merged = {
			...merged,
			...blueprint.stylePresets[field.stylePreset],
		};
	}

	// 4. Apply field-specific formatting
	if (field.formatting) {
		merged = {
			...merged,
			...field.formatting,
		};
	}

	return merged;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Represents a single validation error.
 */
export interface ValidationError {
	fieldId: string;
	lineNumber?: string;
	message: string;
	severity: ValidationSeverity;
	rule: ValidationType;
	actualValue?: unknown;
	expectedValue?: unknown;
}

/**
 * Result of validating a form.
 */
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationError[];
}

/**
 * Validates a single field's value against its validation rules.
 *
 * @param field - The field annotation
 * @param value - The value to validate
 * @param allData - All form data (for cross-field validation)
 * @returns Array of validation errors (empty if valid)
 */
export function validateField(
	field: FieldAnnotation,
	value: unknown,
	_allData?: Record<string, unknown>,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!field.validations) {
		return errors;
	}

	for (const rule of field.validations) {
		const error = validateRule(field, value, rule, _allData);
		if (error) {
			errors.push(error);
		}
	}

	return errors;
}

/**
 * Validates a value against a single validation rule.
 */
function validateRule(
	field: FieldAnnotation,
	value: unknown,
	rule: ValidationRule,
	_allData?: Record<string, unknown>,
): ValidationError | null {
	const severity = rule.severity ?? ValidationSeverity.ERROR;

	switch (rule.type) {
		case ValidationType.REQUIRED:
			if (value === null || value === undefined || value === "") {
				return {
					fieldId: field.id,
					lineNumber: field.lineNumber,
					message: rule.message,
					severity,
					rule: rule.type,
					actualValue: value,
				};
			}
			break;

		case ValidationType.MIN_LENGTH:
			if (typeof value === "string" && value.length < (rule.length ?? 0)) {
				return {
					fieldId: field.id,
					lineNumber: field.lineNumber,
					message: rule.message,
					severity,
					rule: rule.type,
					actualValue: value.length,
					expectedValue: rule.length,
				};
			}
			break;

		case ValidationType.MAX_LENGTH:
			if (
				typeof value === "string" &&
				value.length > (rule.length ?? Infinity)
			) {
				return {
					fieldId: field.id,
					lineNumber: field.lineNumber,
					message: rule.message,
					severity,
					rule: rule.type,
					actualValue: value.length,
					expectedValue: rule.length,
				};
			}
			break;

		case ValidationType.PATTERN:
			if (typeof value === "string" && rule.pattern) {
				const regex = new RegExp(rule.pattern);
				if (!regex.test(value)) {
					return {
						fieldId: field.id,
						lineNumber: field.lineNumber,
						message: rule.message,
						severity,
						rule: rule.type,
						actualValue: value,
						expectedValue: rule.pattern,
					};
				}
			}
			break;

		case ValidationType.RANGE:
			if (typeof value === "number") {
				if (rule.min !== undefined && value < rule.min) {
					return {
						fieldId: field.id,
						lineNumber: field.lineNumber,
						message: rule.message,
						severity,
						rule: rule.type,
						actualValue: value,
						expectedValue: `min: ${rule.min}`,
					};
				}
				if (rule.max !== undefined && value > rule.max) {
					return {
						fieldId: field.id,
						lineNumber: field.lineNumber,
						message: rule.message,
						severity,
						rule: rule.type,
						actualValue: value,
						expectedValue: `max: ${rule.max}`,
					};
				}
			}
			break;
	}

	return null;
}

/**
 * Validates an entire form blueprint against taxpayer data.
 *
 * @param blueprint - The form blueprint
 * @param data - Taxpayer data
 * @returns Validation result with all errors and warnings
 */
export function validateForm(
	blueprint: FormBlueprint,
	data: Record<string, unknown>,
): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	for (const page of blueprint.pages) {
		for (const field of page.fields) {
			// Skip validation for fields hidden by conditional logic
			if (field.conditionalLogic) {
				const shouldShow = evaluateConditionalLogic(
					field.conditionalLogic,
					data,
					blueprint,
				);
				if (
					!shouldShow &&
					field.conditionalLogic.action === ConditionalAction.SHOW
				) {
					continue;
				}
			}

			const value = resolveJSONPath(field.dataBinding.path, data);
			const fieldErrors = validateField(field, value, data);

			for (const error of fieldErrors) {
				if (error.severity === ValidationSeverity.ERROR) {
					errors.push(error);
				} else {
					warnings.push(error);
				}
			}
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

// ============================================================================
// CONDITIONAL LOGIC EVALUATION
// ============================================================================

/**
 * Evaluates conditional logic for a field.
 *
 * @param logic - The conditional logic definition
 * @param data - Taxpayer data
 * @param blueprint - The form blueprint (for field references)
 * @returns Whether the condition is satisfied
 */
export function evaluateConditionalLogic(
	logic: ConditionalLogic,
	data: Record<string, unknown>,
	blueprint: FormBlueprint,
): boolean {
	const results = logic.conditions.map((condition) =>
		evaluateCondition(condition, data, blueprint),
	);

	switch (logic.operator) {
		case LogicalOperator.AND:
			return results.every((r) => r);
		case LogicalOperator.OR:
			return results.some((r) => r);
		case LogicalOperator.NOT:
			return !results[0];
		case LogicalOperator.XOR:
			return results.filter((r) => r).length === 1;
		default:
			return false;
	}
}

/**
 * Evaluates a single condition.
 */
function evaluateCondition(
	condition: Condition,
	data: Record<string, unknown>,
	blueprint: FormBlueprint,
): boolean {
	// Resolve the source value (could be JSONPath or field ID)
	let sourceValue: unknown;

	if (condition.source.startsWith("$")) {
		// JSONPath
		sourceValue = resolveJSONPath(condition.source, data);
	} else {
		// Field ID - resolve through data binding
		const field = findFieldById(blueprint, condition.source);
		if (field) {
			sourceValue = resolveJSONPath(field.dataBinding.path, data);
		}
	}

	const targetValue = condition.value;

	switch (condition.operator) {
		case ComparisonOperator.EQUALS:
			return sourceValue === targetValue;
		case ComparisonOperator.NOT_EQUALS:
			return sourceValue !== targetValue;
		case ComparisonOperator.GREATER_THAN:
			return Number(sourceValue) > Number(targetValue);
		case ComparisonOperator.GREATER_THAN_OR_EQUALS:
			return Number(sourceValue) >= Number(targetValue);
		case ComparisonOperator.LESS_THAN:
			return Number(sourceValue) < Number(targetValue);
		case ComparisonOperator.LESS_THAN_OR_EQUALS:
			return Number(sourceValue) <= Number(targetValue);
		case ComparisonOperator.CONTAINS:
			return String(sourceValue).includes(String(targetValue));
		case ComparisonOperator.IS_EMPTY:
			return (
				sourceValue === null || sourceValue === undefined || sourceValue === ""
			);
		case ComparisonOperator.IS_NOT_EMPTY:
			return (
				sourceValue !== null && sourceValue !== undefined && sourceValue !== ""
			);
		case ComparisonOperator.IN:
			if (Array.isArray(targetValue)) {
				return targetValue.includes(sourceValue as string | number | boolean);
			}
			return false;
		case ComparisonOperator.NOT_IN:
			if (Array.isArray(targetValue)) {
				return !targetValue.includes(sourceValue as string | number | boolean);
			}
			return true;
		case ComparisonOperator.MATCHES_PATTERN:
			if (typeof sourceValue === "string" && typeof targetValue === "string") {
				return new RegExp(targetValue).test(sourceValue);
			}
			return false;
		default:
			return false;
	}
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formats a currency value according to formatting rules.
 *
 * @param value - Numeric value
 * @param format - Currency format
 * @param decimalPlaces - Number of decimal places
 * @param thousandsSeparator - Whether to add comma separators
 * @returns Formatted string
 */
export function formatCurrency(
	value: number,
	format: CurrencyFormat = CurrencyFormat.USD_NO_SYMBOL,
	decimalPlaces: number = 0,
	thousandsSeparator: boolean = true,
): string {
	const absValue = Math.abs(value);
	const isNegative = value < 0;

	let formatted: string;

	switch (format) {
		case CurrencyFormat.USD:
			formatted = absValue.toFixed(decimalPlaces);
			if (thousandsSeparator) {
				formatted = addThousandsSeparators(formatted);
			}
			formatted = `$${formatted}`;
			break;

		case CurrencyFormat.USD_NO_SYMBOL:
			formatted = absValue.toFixed(decimalPlaces);
			if (thousandsSeparator) {
				formatted = addThousandsSeparators(formatted);
			}
			break;

		case CurrencyFormat.USD_WITH_CENTS:
			formatted = absValue.toFixed(2);
			if (thousandsSeparator) {
				formatted = addThousandsSeparators(formatted);
			}
			break;

		case CurrencyFormat.USD_WHOLE:
			formatted = Math.round(absValue).toString();
			if (thousandsSeparator) {
				formatted = addThousandsSeparators(formatted);
			}
			break;

		default:
			formatted = absValue.toFixed(decimalPlaces);
	}

	return isNegative ? `(${formatted})` : formatted;
}

/**
 * Adds thousands separators to a number string.
 */
function addThousandsSeparators(numStr: string): string {
	const parts = numStr.split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}

/**
 * Formats a date according to the specified pattern.
 *
 * @param date - Date value (Date object or ISO string)
 * @param format - Date format pattern
 * @returns Formatted date string
 */
export function formatDate(
	date: Date | string,
	format: DateFormat = DateFormat.MM_DD_YYYY,
): string {
	const d = typeof date === "string" ? new Date(date) : date;

	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	const year = String(d.getFullYear());
	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	switch (format) {
		case DateFormat.MM_DD_YYYY:
			return `${month}/${day}/${year}`;
		case DateFormat.YYYY_MM_DD:
			return `${year}-${month}-${day}`;
		case DateFormat.DD_MM_YYYY:
			return `${day}/${month}/${year}`;
		case DateFormat.MMDDYYYY:
			return `${month}${day}${year}`;
		case DateFormat.MONTH_DAY_YEAR:
			return `${monthNames[d.getMonth()]} ${day}, ${year}`;
		default:
			return `${month}/${day}/${year}`;
	}
}

/**
 * Formats an SSN with or without separators.
 *
 * @param ssn - 9-digit SSN (with or without dashes)
 * @param showSeparators - Whether to include dashes
 * @param mask - Whether to mask first 5 digits
 * @returns Formatted SSN
 */
export function formatSSN(
	ssn: string,
	showSeparators: boolean = true,
	mask: boolean = false,
): string {
	// Remove any existing dashes
	const digits = ssn.replace(/\D/g, "");

	if (digits.length !== 9) {
		return ssn; // Return as-is if not valid
	}

	let formatted: string;

	if (mask) {
		formatted = `***-**-${digits.slice(5)}`;
	} else if (showSeparators) {
		formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
	} else {
		formatted = digits;
	}

	return formatted;
}

// ============================================================================
// BLUEPRINT UTILITIES
// ============================================================================

/**
 * Creates a deep clone of a form blueprint.
 *
 * @param blueprint - Blueprint to clone
 * @returns Deep copy of the blueprint
 */
export function cloneBlueprint(blueprint: FormBlueprint): FormBlueprint {
	return JSON.parse(JSON.stringify(blueprint));
}

/**
 * Merges two blueprints, with the second overriding the first.
 * Useful for applying customizations to a base blueprint.
 *
 * @param base - Base blueprint
 * @param overlay - Overlay blueprint with overrides
 * @returns Merged blueprint
 */
export function mergeBlueprints(
	base: FormBlueprint,
	overlay: Partial<FormBlueprint>,
): FormBlueprint {
	const merged = cloneBlueprint(base);

	if (overlay.version) {
		merged.version = overlay.version;
	}

	if (overlay.metadata) {
		merged.metadata = { ...merged.metadata, ...overlay.metadata };
	}

	if (overlay.globalStyles) {
		merged.globalStyles = { ...merged.globalStyles, ...overlay.globalStyles };
	}

	if (overlay.stylePresets) {
		merged.stylePresets = { ...merged.stylePresets, ...overlay.stylePresets };
	}

	// Merge pages by pageNumber
	if (overlay.pages) {
		for (const overlayPage of overlay.pages) {
			const basePage = merged.pages.find(
				(p) => p.pageNumber === overlayPage.pageNumber,
			);
			if (basePage) {
				// Merge fields by ID
				for (const overlayField of overlayPage.fields) {
					const baseFieldIndex = basePage.fields.findIndex(
						(f) => f.id === overlayField.id,
					);
					if (baseFieldIndex >= 0) {
						basePage.fields[baseFieldIndex] = {
							...basePage.fields[baseFieldIndex],
							...overlayField,
						};
					} else {
						basePage.fields.push(overlayField);
					}
				}
			} else {
				merged.pages.push(overlayPage);
			}
		}
	}

	return merged;
}

/**
 * Generates a summary of a blueprint for debugging.
 *
 * @param blueprint - The form blueprint
 * @returns Summary object
 */
export function summarizeBlueprint(blueprint: FormBlueprint): {
	id: string;
	version: string;
	pageCount: number;
	totalFields: number;
	fieldsByType: Record<string, number>;
	groupCount: number;
} {
	const fieldsByType: Record<string, number> = {};
	let totalFields = 0;

	for (const page of blueprint.pages) {
		for (const field of page.fields) {
			totalFields++;
			fieldsByType[field.dataType] = (fieldsByType[field.dataType] || 0) + 1;
		}
	}

	return {
		id: blueprint.id,
		version: blueprint.version,
		pageCount: blueprint.pages.length,
		totalFields,
		fieldsByType,
		groupCount: blueprint.fieldGroups?.length ?? 0,
	};
}
