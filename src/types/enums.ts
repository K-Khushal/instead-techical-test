/**
 * Tax Form Annotation System - Enumerations
 *
 * This module defines all controlled vocabularies used throughout the annotation system.
 * Using enums ensures type safety and prevents invalid values from entering the system.
 *
 * @module enums
 * @version 1.0.0
 */

// ============================================================================
// DATA TYPE ENUMERATIONS
// ============================================================================

/**
 * Defines the semantic data types that can be rendered in form fields.
 *
 * The rendering engine uses this to apply appropriate formatting and validation.
 * Each type has specific rendering behaviors:
 * - STRING: Raw text, no special formatting
 * - CURRENCY: Formatted with currency symbols, thousands separators
 * - NUMBER: Numeric value with optional decimal places
 * - CHECKBOX: Boolean value rendered as a checkmark or empty box
 * - DATE: Formatted date string
 * - SSN: Social Security Number with masking support
 * - EIN: Employer Identification Number
 * - PHONE: Phone number with formatting
 * - PERCENTAGE: Numeric value displayed with % symbol
 */
export enum FieldDataType {
	STRING = "string",
	CURRENCY = "currency",
	NUMBER = "number",
	CHECKBOX = "checkbox",
	DATE = "date",
	SSN = "ssn",
	EIN = "ein",
	PHONE = "phone",
	PERCENTAGE = "percentage",
}

/**
 * Filing status options for IRS Form 1040.
 *
 * These correspond to the filing status checkboxes on page 1 of Form 1040.
 * Only one filing status can be selected per return.
 */
export enum FilingStatus {
	SINGLE = "single",
	MARRIED_FILING_JOINTLY = "married_filing_jointly",
	MARRIED_FILING_SEPARATELY = "married_filing_separately",
	HEAD_OF_HOUSEHOLD = "head_of_household",
	QUALIFYING_SURVIVING_SPOUSE = "qualifying_surviving_spouse",
}

// ============================================================================
// POSITIONING & LAYOUT ENUMERATIONS
// ============================================================================

/**
 * Coordinate system used for positioning fields on the form.
 *
 * POINTS: Standard PDF coordinate system (72 points per inch)
 * PIXELS: Pixel-based for rasterized images
 * PERCENTAGE: Relative positioning (useful for responsive layouts)
 * INCHES: Direct inch measurements
 * MILLIMETERS: Metric measurements
 */
export enum CoordinateUnit {
	POINTS = "points",
	PIXELS = "pixels",
	PERCENTAGE = "percentage",
	INCHES = "inches",
	MILLIMETERS = "millimeters",
}

/**
 * Horizontal text alignment within a field's bounding box.
 */
export enum HorizontalAlignment {
	LEFT = "left",
	CENTER = "center",
	RIGHT = "right",
	JUSTIFY = "justify",
}

/**
 * Vertical text alignment within a field's bounding box.
 */
export enum VerticalAlignment {
	TOP = "top",
	MIDDLE = "middle",
	BOTTOM = "bottom",
	BASELINE = "baseline",
}

/**
 * Strategies for handling text that exceeds the field's bounding box.
 *
 * TRUNCATE: Cut off text at boundary (optionally with ellipsis)
 * WRAP: Allow text to flow to multiple lines
 * SCALE_TO_FIT: Reduce font size to fit content
 * OVERFLOW: Allow text to exceed boundaries (not recommended)
 * ERROR: Throw an error if content doesn't fit
 */
export enum OverflowBehavior {
	TRUNCATE = "truncate",
	WRAP = "wrap",
	SCALE_TO_FIT = "scale_to_fit",
	OVERFLOW = "overflow",
	ERROR = "error",
}

// ============================================================================
// TYPOGRAPHY ENUMERATIONS
// ============================================================================

/**
 * Font weight options for text rendering.
 *
 * Numeric values follow the CSS font-weight specification.
 */
export enum FontWeight {
	THIN = 100,
	EXTRA_LIGHT = 200,
	LIGHT = 300,
	REGULAR = 400,
	MEDIUM = 500,
	SEMI_BOLD = 600,
	BOLD = 700,
	EXTRA_BOLD = 800,
	BLACK = 900,
}

/**
 * Font style options.
 */
export enum FontStyle {
	NORMAL = "normal",
	ITALIC = "italic",
	OBLIQUE = "oblique",
}

/**
 * Text decoration options.
 */
export enum TextDecoration {
	NONE = "none",
	UNDERLINE = "underline",
	STRIKETHROUGH = "strikethrough",
}

// ============================================================================
// VALIDATION ENUMERATIONS
// ============================================================================

/**
 * Types of validation rules that can be applied to fields.
 *
 * REQUIRED: Field must have a value
 * MIN_LENGTH: Minimum character count
 * MAX_LENGTH: Maximum character count
 * PATTERN: Regular expression match
 * RANGE: Numeric value within min/max bounds
 * CUSTOM: Custom validation function reference
 * CROSS_FIELD: Validation depends on other field values
 * LUHN: Luhn algorithm check (for SSN, credit cards, etc.)
 */
export enum ValidationType {
	REQUIRED = "required",
	MIN_LENGTH = "min_length",
	MAX_LENGTH = "max_length",
	PATTERN = "pattern",
	RANGE = "range",
	CUSTOM = "custom",
	CROSS_FIELD = "cross_field",
	LUHN = "luhn",
}

/**
 * Severity levels for validation errors.
 *
 * ERROR: Prevents form submission
 * WARNING: Allows submission but alerts user
 * INFO: Informational message only
 */
export enum ValidationSeverity {
	ERROR = "error",
	WARNING = "warning",
	INFO = "info",
}

// ============================================================================
// CONDITIONAL LOGIC ENUMERATIONS
// ============================================================================

/**
 * Comparison operators for conditional rendering logic.
 */
export enum ComparisonOperator {
	EQUALS = "eq",
	NOT_EQUALS = "neq",
	GREATER_THAN = "gt",
	GREATER_THAN_OR_EQUALS = "gte",
	LESS_THAN = "lt",
	LESS_THAN_OR_EQUALS = "lte",
	CONTAINS = "contains",
	NOT_CONTAINS = "not_contains",
	STARTS_WITH = "starts_with",
	ENDS_WITH = "ends_with",
	IS_EMPTY = "is_empty",
	IS_NOT_EMPTY = "is_not_empty",
	IN = "in",
	NOT_IN = "not_in",
	MATCHES_PATTERN = "matches_pattern",
}

/**
 * Logical operators for combining multiple conditions.
 */
export enum LogicalOperator {
	AND = "and",
	OR = "or",
	NOT = "not",
	XOR = "xor",
}

/**
 * Actions that can be taken when a condition is met.
 */
export enum ConditionalAction {
	SHOW = "show",
	HIDE = "hide",
	ENABLE = "enable",
	DISABLE = "disable",
	SET_VALUE = "set_value",
	CLEAR_VALUE = "clear_value",
	REQUIRE = "require",
	OPTIONAL = "optional",
	APPLY_STYLE = "apply_style",
}

// ============================================================================
// FORM STRUCTURE ENUMERATIONS
// ============================================================================

/**
 * Types of field groups for organizing related fields.
 */
export enum FieldGroupType {
	SECTION = "section",
	REPEATABLE = "repeatable",
	TABLE = "table",
	SCHEDULE = "schedule",
	LINE_ITEM = "line_item",
}

/**
 * Form status for tracking the lifecycle of form annotations.
 */
export enum FormStatus {
	DRAFT = "draft",
	PUBLISHED = "published",
	DEPRECATED = "deprecated",
	ARCHIVED = "archived",
}

/**
 * Page orientation options.
 */
export enum PageOrientation {
	PORTRAIT = "portrait",
	LANDSCAPE = "landscape",
}

// ============================================================================
// RENDERING ENUMERATIONS
// ============================================================================

/**
 * Checkbox rendering styles.
 */
export enum CheckboxStyle {
	CHECKMARK = "checkmark",
	X_MARK = "x_mark",
	FILLED_SQUARE = "filled_square",
	FILLED_CIRCLE = "filled_circle",
	CUSTOM = "custom",
}

/**
 * Date format options for DATE type fields.
 */
export enum DateFormat {
	MM_DD_YYYY = "MM/DD/YYYY",
	YYYY_MM_DD = "YYYY-MM-DD",
	DD_MM_YYYY = "DD/MM/YYYY",
	MMDDYYYY = "MMDDYYYY",
	MONTH_DAY_YEAR = "Month DD, YYYY",
}

/**
 * Currency format options.
 */
export enum CurrencyFormat {
	USD = "USD",
	USD_NO_SYMBOL = "USD_NO_SYMBOL",
	USD_WITH_CENTS = "USD_WITH_CENTS",
	USD_WHOLE = "USD_WHOLE",
}
