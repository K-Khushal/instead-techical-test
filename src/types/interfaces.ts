/**
 * Tax Form Annotation System - Core Interfaces
 *
 * This module defines the primary interfaces that make up the form annotation schema.
 * These interfaces form the backbone of the system, enabling precise positioning,
 * formatting, and data binding for tax form overlays.
 *
 * @module interfaces
 * @version 1.0.0
 */

import type {
	CheckboxStyle,
	ComparisonOperator,
	ConditionalAction,
	CoordinateUnit,
	CurrencyFormat,
	DateFormat,
	FieldDataType,
	FieldGroupType,
	FontStyle,
	FontWeight,
	FormStatus,
	HorizontalAlignment,
	LogicalOperator,
	OverflowBehavior,
	PageOrientation,
	TextDecoration,
	ValidationSeverity,
	ValidationType,
	VerticalAlignment,
} from "./enums";

// ============================================================================
// CORE BLUEPRINT INTERFACE
// ============================================================================

/**
 * The root interface for a complete form annotation blueprint.
 *
 * This is the top-level container that holds all metadata, pages, and fields
 * necessary to render values onto a tax form. A single FormBlueprint represents
 * one complete form (e.g., Form 1040 for tax year 2025).
 *
 * @example
 * ```typescript
 * const form1040: FormBlueprint = {
 *   id: 'irs-form-1040-2025',
 *   version: '1.0.0',
 *   schemaVersion: '1.0.0',
 *   metadata: { ... },
 *   coordinateSystem: { ... },
 *   pages: [ ... ],
 *   fieldGroups: [ ... ],
 *   globalStyles: { ... },
 * };
 * ```
 */
export interface FormBlueprint {
	/**
	 * Unique identifier for this form blueprint.
	 * Should follow a consistent naming convention: {issuer}-form-{number}-{year}
	 */
	id: string;

	/**
	 * Version of this specific form blueprint (semantic versioning).
	 * Increment when field positions or definitions change.
	 */
	version: string;

	/**
	 * Version of the annotation schema this blueprint conforms to.
	 * Used for backward compatibility checking.
	 */
	schemaVersion: string;

	/**
	 * Descriptive metadata about the form.
	 */
	metadata: FormMetadata;

	/**
	 * Defines how coordinates are interpreted across all pages.
	 */
	coordinateSystem: CoordinateSystemDefinition;

	/**
	 * Array of page definitions, one for each physical page of the form.
	 */
	pages: PageDefinition[];

	/**
	 * Logical groupings of related fields (e.g., "Income", "Deductions").
	 * Optional but recommended for complex forms.
	 */
	fieldGroups?: FieldGroup[];

	/**
	 * Global styles that apply to all fields unless overridden.
	 */
	globalStyles?: GlobalStyleDefinition;

	/**
	 * Reusable style definitions that can be referenced by fields.
	 */
	stylePresets?: Record<string, Partial<FormattingRules>>;

	/**
	 * Global validation rules that apply across the entire form.
	 */
	globalValidations?: ValidationRule[];

	/**
	 * Custom data transformers that can be applied to field values.
	 */
	transformers?: TransformerDefinition[];
}

// ============================================================================
// METADATA INTERFACES
// ============================================================================

/**
 * Metadata about the form for documentation, auditing, and debugging.
 */
export interface FormMetadata {
	/**
	 * Official form name (e.g., "U.S. Individual Income Tax Return")
	 */
	formName: string;

	/**
	 * Form number (e.g., "1040", "1040-SR", "W-2")
	 */
	formNumber: string;

	/**
	 * Tax year this form applies to
	 */
	taxYear: number;

	/**
	 * Issuing authority (e.g., "IRS", "State of California")
	 */
	issuer: string;

	/**
	 * Official revision date of the underlying form
	 */
	revisionDate: string;

	/**
	 * OMB control number for federal forms
	 */
	ombNumber?: string;

	/**
	 * Catalog number for IRS forms
	 */
	catalogNumber?: string;

	/**
	 * Current status of this blueprint
	 */
	status: FormStatus;

	/**
	 * When this blueprint was created
	 */
	createdAt: string;

	/**
	 * When this blueprint was last modified
	 */
	updatedAt: string;

	/**
	 * Author or team that created this blueprint
	 */
	author?: string;

	/**
	 * Additional notes for developers
	 */
	notes?: string;

	/**
	 * Tags for categorization and search
	 */
	tags?: string[];

	/**
	 * Related forms that may need to be filed together
	 */
	relatedForms?: string[];

	/**
	 * Link to official form instructions
	 */
	instructionsUrl?: string;
}

// ============================================================================
// COORDINATE SYSTEM INTERFACES
// ============================================================================

/**
 * Defines the coordinate system used for positioning fields.
 *
 * Tax forms are typically based on standard paper sizes (letter, legal).
 * The coordinate system defines the origin point and measurement units
 * that all field positions are relative to.
 */
export interface CoordinateSystemDefinition {
	/**
	 * Unit of measurement for all coordinates
	 */
	unit: CoordinateUnit;

	/**
	 * Where (0, 0) is located on the page.
	 *
	 * - "top-left": Standard screen coordinates (most common)
	 * - "bottom-left": PDF native coordinates
	 */
	origin: "top-left" | "bottom-left";

	/**
	 * Resolution in DPI (dots per inch).
	 * Required when using pixel coordinates.
	 * Standard is 72 DPI for PDF, 300 DPI for print.
	 */
	dpi?: number;

	/**
	 * Reference page dimensions (used for percentage-based positioning)
	 */
	referenceWidth?: number;
	referenceHeight?: number;
}

// ============================================================================
// PAGE DEFINITION INTERFACES
// ============================================================================

/**
 * Defines a single page within the form.
 *
 * Each page has its own dimensions, fields, and optional background image.
 * Multi-page forms will have multiple PageDefinition objects.
 */
export interface PageDefinition {
	/**
	 * Page number (1-indexed for human readability)
	 */
	pageNumber: number;

	/**
	 * Optional human-readable page identifier
	 */
	pageId?: string;

	/**
	 * Page dimensions
	 */
	dimensions: PageDimensions;

	/**
	 * Page orientation
	 */
	orientation: PageOrientation;

	/**
	 * Path or URL to the background form image/PDF.
	 * Used by rendering engines to overlay values.
	 */
	backgroundSource?: string;

	/**
	 * All fields on this page
	 */
	fields: FieldAnnotation[];

	/**
	 * Page-level margins (printable area boundaries)
	 */
	margins?: PageMargins;

	/**
	 * Optional page-specific styles that override global styles
	 */
	pageStyles?: Partial<GlobalStyleDefinition>;
}

/**
 * Physical dimensions of a page.
 */
export interface PageDimensions {
	/**
	 * Page width in the coordinate system's units
	 */
	width: number;

	/**
	 * Page height in the coordinate system's units
	 */
	height: number;

	/**
	 * Standard paper size reference (for documentation)
	 */
	paperSize?: "letter" | "legal" | "a4" | "custom";
}

/**
 * Page margin definitions.
 */
export interface PageMargins {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

// ============================================================================
// FIELD ANNOTATION INTERFACES
// ============================================================================

/**
 * Complete definition for a single field on the form.
 *
 * This is the core interface that brings together positioning, formatting,
 * data binding, and validation for one fillable area on the tax form.
 *
 * @example
 * ```typescript
 * const firstNameField: FieldAnnotation = {
 *   id: 'taxpayer_first_name',
 *   label: 'First name and middle initial',
 *   dataType: FieldDataType.STRING,
 *   positioning: {
 *     x: 45,
 *     y: 126,
 *     width: 180,
 *     height: 18,
 *   },
 *   dataBinding: {
 *     path: '$.taxpayer.firstName',
 *   },
 *   formatting: {
 *     textTransform: 'uppercase',
 *   },
 * };
 * ```
 */
export interface FieldAnnotation {
	/**
	 * Unique identifier for this field within the form.
	 * Should be descriptive and follow consistent naming conventions.
	 */
	id: string;

	/**
	 * Human-readable label for the field (matches form text where possible)
	 */
	label: string;

	/**
	 * IRS line number reference (e.g., "1a", "2b", "11")
	 */
	lineNumber?: string;

	/**
	 * Semantic data type for this field
	 */
	dataType: FieldDataType;

	/**
	 * Position and size of the field on the page
	 */
	positioning: Positioning;

	/**
	 * How to retrieve the value for this field from source data
	 */
	dataBinding: DataBinding;

	/**
	 * Visual formatting rules for rendering
	 */
	formatting?: FormattingRules;

	/**
	 * Validation rules for this field
	 */
	validations?: ValidationRule[];

	/**
	 * Conditional logic for showing/hiding or modifying the field
	 */
	conditionalLogic?: ConditionalLogic;

	/**
	 * Reference to a style preset defined in the blueprint
	 */
	stylePreset?: string;

	/**
	 * Field group this belongs to (references FieldGroup.id)
	 */
	groupId?: string;

	/**
	 * Whether this is a required field
	 */
	required?: boolean;

	/**
	 * Whether this field is read-only (calculated or system-generated)
	 */
	readOnly?: boolean;

	/**
	 * Default value if no data is provided
	 */
	defaultValue?: string | number | boolean;

	/**
	 * Tooltip or help text for the field
	 */
	helpText?: string;

	/**
	 * Rendering order (lower numbers render first)
	 */
	zIndex?: number;

	/**
	 * Additional metadata for debugging or auditing
	 */
	meta?: FieldMetadata;
}

/**
 * Additional metadata attached to a field.
 */
export interface FieldMetadata {
	/**
	 * Internal notes for developers
	 */
	notes?: string;

	/**
	 * When this field definition was last modified
	 */
	lastModified?: string;

	/**
	 * Who last modified this field definition
	 */
	modifiedBy?: string;

	/**
	 * IRS form line reference for cross-referencing
	 */
	irsReference?: string;

	/**
	 * Custom key-value pairs for extensibility
	 */
	customProperties?: Record<string, unknown>;
}

// ============================================================================
// POSITIONING INTERFACES
// ============================================================================

/**
 * Defines the exact position and dimensions of a field's bounding box.
 *
 * All values are in the units defined by the blueprint's coordinate system.
 * The bounding box defines where the rendered value will appear on the form.
 */
export interface Positioning {
	/**
	 * X-coordinate of the bounding box's left edge
	 */
	x: number;

	/**
	 * Y-coordinate of the bounding box's top edge
	 * (or bottom edge if using bottom-left origin)
	 */
	y: number;

	/**
	 * Width of the bounding box
	 */
	width: number;

	/**
	 * Height of the bounding box
	 */
	height: number;

	/**
	 * Optional rotation in degrees (clockwise)
	 */
	rotation?: number;

	/**
	 * Optional padding inside the bounding box
	 */
	padding?: BoxPadding;
}

/**
 * Padding values for field content within the bounding box.
 */
export interface BoxPadding {
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
}

// ============================================================================
// DATA BINDING INTERFACES
// ============================================================================

/**
 * Defines how a field's value is retrieved from source data.
 *
 * Uses JSONPath-like syntax to navigate deeply nested data structures.
 * Supports both simple paths and complex expressions with transformations.
 *
 * @example Simple path
 * ```typescript
 * const binding: DataBinding = {
 *   path: '$.taxpayer.income.wages',
 * };
 * ```
 *
 * @example With transformation
 * ```typescript
 * const binding: DataBinding = {
 *   path: '$.taxpayer.income.totalWages',
 *   transform: 'currency',
 *   fallback: '0',
 * };
 * ```
 */
export interface DataBinding {
	/**
	 * JSONPath expression to locate the value in source data.
	 *
	 * Examples:
	 * - '$.taxpayer.firstName' - Simple property access
	 * - '$.dependents[0].ssn' - Array access
	 * - '$.income.w2Forms[*].wages' - Aggregate all W-2 wages
	 * - '$.deductions.mortgage.interest || $.deductions.standard' - Fallback
	 */
	path: string;

	/**
	 * Name of a transformer to apply to the raw value.
	 * References transformers defined in the blueprint or built-in ones.
	 */
	transform?: string;

	/**
	 * Parameters to pass to the transformer
	 */
	transformParams?: Record<string, unknown>;

	/**
	 * Fallback value if the path resolves to null/undefined
	 */
	fallback?: string | number | boolean;

	/**
	 * For checkbox fields: the value that indicates "checked"
	 */
	checkedValue?: string | number | boolean;

	/**
	 * For repeatable fields: the source array path
	 */
	repeatSource?: string;

	/**
	 * For calculated fields: expression to compute the value
	 */
	expression?: CalculationExpression;
}

/**
 * Definition for a calculated field expression.
 */
export interface CalculationExpression {
	/**
	 * Type of expression
	 */
	type: "sum" | "subtract" | "multiply" | "divide" | "formula" | "lookup";

	/**
	 * Operands (field IDs or literal values)
	 */
	operands?: (string | number)[];

	/**
	 * For 'formula' type: the expression string
	 * Example: "{line1} + {line2} - {line3}"
	 */
	formula?: string;

	/**
	 * For 'lookup' type: lookup table reference
	 */
	lookupTable?: string;
	lookupKey?: string;
}

// ============================================================================
// FORMATTING INTERFACES
// ============================================================================

/**
 * Visual formatting rules for rendering field values.
 *
 * Controls typography, alignment, colors, and special formatting
 * like currency symbols or date patterns.
 */
export interface FormattingRules {
	/**
	 * Font family (e.g., 'Courier', 'Arial', 'Times New Roman')
	 */
	fontFamily?: string;

	/**
	 * Font size in points
	 */
	fontSize?: number;

	/**
	 * Font weight
	 */
	fontWeight?: FontWeight;

	/**
	 * Font style (normal, italic)
	 */
	fontStyle?: FontStyle;

	/**
	 * Text decoration
	 */
	textDecoration?: TextDecoration;

	/**
	 * Text color (hex, rgb, or named color)
	 */
	textColor?: string;

	/**
	 * Background color for the field area
	 */
	backgroundColor?: string;

	/**
	 * Horizontal text alignment
	 */
	horizontalAlign?: HorizontalAlignment;

	/**
	 * Vertical text alignment
	 */
	verticalAlign?: VerticalAlignment;

	/**
	 * Line height multiplier
	 */
	lineHeight?: number;

	/**
	 * Letter spacing in points
	 */
	letterSpacing?: number;

	/**
	 * Text transformation
	 */
	textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";

	/**
	 * How to handle text that exceeds the bounding box
	 */
	overflow?: OverflowBehavior;

	/**
	 * For CURRENCY type: format specification
	 */
	currencyFormat?: CurrencyFormat;

	/**
	 * For NUMBER type: number of decimal places
	 */
	decimalPlaces?: number;

	/**
	 * Whether to show thousands separators (e.g., 1,000,000)
	 */
	thousandsSeparator?: boolean;

	/**
	 * For DATE type: format pattern
	 */
	dateFormat?: DateFormat;

	/**
	 * For CHECKBOX type: rendering style
	 */
	checkboxStyle?: CheckboxStyle;

	/**
	 * For CHECKBOX type: custom character/symbol when checked
	 */
	checkboxCharacter?: string;

	/**
	 * For SSN/EIN: whether to show dashes (XXX-XX-XXXX)
	 */
	showSeparators?: boolean;

	/**
	 * For SSN: whether to mask digits (***-**-1234)
	 */
	maskValue?: boolean;

	/**
	 * Minimum font size when using scale-to-fit overflow
	 */
	minFontSize?: number;

	/**
	 * Maximum number of lines when wrapping
	 */
	maxLines?: number;
}

/**
 * Global style definitions that apply to all fields.
 */
export interface GlobalStyleDefinition extends FormattingRules {
	/**
	 * Default styles by data type
	 */
	typeDefaults?: Partial<Record<FieldDataType, Partial<FormattingRules>>>;
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

/**
 * A single validation rule for a field.
 */
export interface ValidationRule {
	/**
	 * Type of validation
	 */
	type: ValidationType;

	/**
	 * Error message to display when validation fails
	 */
	message: string;

	/**
	 * Severity of a failed validation
	 */
	severity?: ValidationSeverity;

	/**
	 * For MIN_LENGTH/MAX_LENGTH: the length constraint
	 */
	length?: number;

	/**
	 * For RANGE: minimum value
	 */
	min?: number;

	/**
	 * For RANGE: maximum value
	 */
	max?: number;

	/**
	 * For PATTERN: regular expression
	 */
	pattern?: string;

	/**
	 * For CROSS_FIELD: references to other field IDs
	 */
	compareFields?: string[];

	/**
	 * For CROSS_FIELD: comparison operator
	 */
	compareOperator?: ComparisonOperator;

	/**
	 * For CUSTOM: reference to a custom validator function
	 */
	customValidator?: string;
}

// ============================================================================
// CONDITIONAL LOGIC INTERFACES
// ============================================================================

/**
 * Conditional logic for dynamic field behavior.
 *
 * Allows fields to be shown/hidden, enabled/disabled, or modified
 * based on the values of other fields.
 */
export interface ConditionalLogic {
	/**
	 * All conditions that must be evaluated
	 */
	conditions: Condition[];

	/**
	 * How multiple conditions are combined
	 */
	operator: LogicalOperator;

	/**
	 * Action to take when conditions are met
	 */
	action: ConditionalAction;

	/**
	 * For SET_VALUE action: the value to set
	 */
	setValue?: string | number | boolean;

	/**
	 * For APPLY_STYLE action: styles to apply
	 */
	applyStyles?: Partial<FormattingRules>;
}

/**
 * A single condition within conditional logic.
 */
export interface Condition {
	/**
	 * Field ID to evaluate (or JSONPath for data-based conditions)
	 */
	source: string;

	/**
	 * Comparison operator
	 */
	operator: ComparisonOperator;

	/**
	 * Value to compare against
	 */
	value: string | number | boolean | (string | number | boolean)[];
}

// ============================================================================
// FIELD GROUP INTERFACES
// ============================================================================

/**
 * Logical grouping of related fields.
 *
 * Used for organizing complex forms and handling repeatable sections
 * like dependent lists or multiple W-2 entries.
 */
export interface FieldGroup {
	/**
	 * Unique identifier for the group
	 */
	id: string;

	/**
	 * Human-readable group name
	 */
	name: string;

	/**
	 * Type of grouping
	 */
	type: FieldGroupType;

	/**
	 * Field IDs that belong to this group
	 */
	fieldIds: string[];

	/**
	 * For REPEATABLE type: maximum number of instances
	 */
	maxInstances?: number;

	/**
	 * For REPEATABLE type: minimum number of instances
	 */
	minInstances?: number;

	/**
	 * For REPEATABLE type: source array path in data
	 */
	repeatSource?: string;

	/**
	 * Parent group ID for nested groupings
	 */
	parentGroupId?: string;

	/**
	 * Display order within parent
	 */
	order?: number;
}

// ============================================================================
// TRANSFORMER INTERFACES
// ============================================================================

/**
 * Definition for a custom data transformer.
 *
 * Transformers process raw data values before rendering.
 */
export interface TransformerDefinition {
	/**
	 * Unique identifier for the transformer
	 */
	id: string;

	/**
	 * Human-readable name
	 */
	name: string;

	/**
	 * Description of what the transformer does
	 */
	description?: string;

	/**
	 * Type of transformer
	 */
	type: "format" | "calculate" | "lookup" | "custom";

	/**
	 * Configuration for the transformer
	 */
	config?: Record<string, unknown>;
}

// ============================================================================
// REPEATABLE FIELD INTERFACES
// ============================================================================

/**
 * Template for repeatable field instances.
 *
 * Used for sections like dependents where the same set of fields
 * repeats for each instance.
 */
export interface RepeatableFieldTemplate {
	/**
	 * Base field definitions (positions are relative within the repeat area)
	 */
	templateFields: FieldAnnotation[];

	/**
	 * Vertical offset between instances
	 */
	verticalOffset: number;

	/**
	 * Horizontal offset between instances (for horizontal layouts)
	 */
	horizontalOffset?: number;

	/**
	 * Maximum number of instances that fit on one page
	 */
	maxPerPage: number;

	/**
	 * Whether to continue on next page if exceeded
	 */
	continueOnNextPage: boolean;
}
