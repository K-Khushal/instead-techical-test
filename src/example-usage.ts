/**
 * Tax Form Annotation System - Example Usage
 *
 * This file demonstrates how to use the form annotation system:
 * - Creating a simple form blueprint
 * - Resolving data bindings
 * - Validating taxpayer data
 * - Formatting values for rendering
 *
 * @module examples/usage
 * @version 1.0.0
 */

import {
	ComparisonOperator,
	ConditionalAction,
	type ConditionalLogic,
	CoordinateUnit,
	CurrencyFormat,
	DateFormat,
	type FieldAnnotation,
	FieldDataType,
	FieldGroupType,
	FontWeight,
	type FormBlueprint,
	FormStatus,
	HorizontalAlignment,
	LogicalOperator,
	OverflowBehavior,
	PageOrientation,
	ValidationSeverity,
	ValidationType,
	VerticalAlignment,
} from "./types";

import {
	evaluateConditionalLogic,
	findFieldById,
	formatCurrency,
	formatDate,
	formatSSN,
	getMergedFormatting,
	resolveJSONPath,
	summarizeBlueprint,
	validateForm,
} from "./utils";

// ============================================================================
// EXAMPLE 1: Creating a Simple Field Annotation
// ============================================================================

/**
 * Example of creating a currency field annotation.
 * This field displays W-2 wages on line 1a of Form 1040.
 */
const wagesField: FieldAnnotation = {
	// Unique identifier for this field
	id: "line_1a_w2_wages",

	// Human-readable label matching the form
	label: "Total amount from Form(s) W-2, box 1",

	// IRS line number for reference
	lineNumber: "1a",

	// This field holds a currency value
	dataType: FieldDataType.CURRENCY,

	// Exact position on the form (in points)
	positioning: {
		x: 522, // 7.25 inches from left
		y: 438, // 6.08 inches from top
		width: 54, // 0.75 inches wide
		height: 12, // Standard row height
		padding: {
			right: 4, // Keep text away from right edge
		},
	},

	// How to get the value from taxpayer data
	dataBinding: {
		path: "$.income.w2Wages", // JSONPath to the value
		fallback: 0, // Default if not found
	},

	// How to display the value
	formatting: {
		horizontalAlign: HorizontalAlignment.RIGHT, // Right-align numbers
		currencyFormat: CurrencyFormat.USD_NO_SYMBOL, // No $ symbol
		thousandsSeparator: true, // Add commas
		decimalPlaces: 0, // Whole dollars only
	},

	// Field must have a value
	required: true,

	// Belongs to the income section
	groupId: "income",
};

// ============================================================================
// EXAMPLE 2: Creating a Checkbox Field
// ============================================================================

/**
 * Example of a filing status checkbox.
 * Only one of these should be checked.
 */
const filingStatusSingle: FieldAnnotation = {
	id: "filing_status_single",
	label: "Single",
	dataType: FieldDataType.CHECKBOX,

	positioning: {
		x: 126,
		y: 198,
		width: 10,
		height: 10,
	},

	dataBinding: {
		path: "$.filingStatus",
		// The checkbox is checked when filingStatus equals 'single'
		checkedValue: "single",
	},

	formatting: {
		horizontalAlign: HorizontalAlignment.CENTER,
		verticalAlign: VerticalAlignment.MIDDLE,
		checkboxCharacter: "X",
		fontWeight: FontWeight.BOLD,
	},

	groupId: "filing_status",
};

// ============================================================================
// EXAMPLE 3: Creating a Field with Conditional Logic
// ============================================================================

/**
 * Example of a field that only appears when married filing jointly.
 * Spouse's SSN is only required for certain filing statuses.
 */
const spouseSsnField: FieldAnnotation = {
	id: "spouse_ssn",
	label: "Spouse's social security number",
	dataType: FieldDataType.SSN,

	positioning: {
		x: 468,
		y: 102,
		width: 108,
		height: 18,
	},

	dataBinding: {
		path: "$.spouse.ssn",
		transform: "ssn_format",
	},

	formatting: {
		letterSpacing: 3,
		showSeparators: true,
		horizontalAlign: HorizontalAlignment.CENTER,
		fontFamily: "Courier",
	},

	// This field is only required when filing jointly or separately
	conditionalLogic: {
		conditions: [
			{
				source: "$.filingStatus",
				operator: ComparisonOperator.IN,
				value: ["married_filing_jointly", "married_filing_separately"],
			},
		],
		operator: LogicalOperator.AND,
		action: ConditionalAction.REQUIRE,
	},

	validations: [
		{
			type: ValidationType.PATTERN,
			message: "SSN must be 9 digits",
			pattern: "^\\d{9}$",
		},
	],

	groupId: "taxpayer_info",
};

// ============================================================================
// EXAMPLE 4: Creating a Complete Mini Blueprint
// ============================================================================

/**
 * Example of a minimal but complete form blueprint.
 * This includes just a few fields to demonstrate the structure.
 */
const exampleBlueprint: FormBlueprint = {
	id: "example-form-2025",
	version: "1.0.0",
	schemaVersion: "1.0.0",

	metadata: {
		formName: "Example Tax Form",
		formNumber: "EXAMPLE",
		taxYear: 2025,
		issuer: "Example Agency",
		revisionDate: "2025-09-01",
		status: FormStatus.DRAFT,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		author: "Instead Engineer",
		notes: "This is an example blueprint for demonstration purposes",
		tags: ["example", "demo"],
	},

	coordinateSystem: {
		unit: CoordinateUnit.POINTS,
		origin: "top-left",
		dpi: 72,
		referenceWidth: 612,
		referenceHeight: 792,
	},

	globalStyles: {
		fontFamily: "Courier",
		fontSize: 10,
		fontWeight: FontWeight.REGULAR,
		textColor: "#000000",
		horizontalAlign: HorizontalAlignment.LEFT,
		verticalAlign: VerticalAlignment.MIDDLE,
		overflow: OverflowBehavior.SCALE_TO_FIT,
		textTransform: "uppercase",
		minFontSize: 6,
	},

	stylePresets: {
		lineTotal: {
			fontWeight: FontWeight.BOLD,
			fontSize: 11,
			horizontalAlign: HorizontalAlignment.RIGHT,
		},
		smallText: {
			fontSize: 8,
			overflow: OverflowBehavior.WRAP,
			maxLines: 2,
		},
	},

	pages: [
		{
			pageNumber: 1,
			pageId: "example-page-1",
			dimensions: {
				width: 612,
				height: 792,
				paperSize: "letter",
			},
			orientation: PageOrientation.PORTRAIT,
			backgroundSource: "assets/example-form.pdf",
			margins: {
				top: 36,
				right: 36,
				bottom: 36,
				left: 36,
			},
			fields: [
				// First name field
				{
					id: "first_name",
					label: "First name",
					dataType: FieldDataType.STRING,
					positioning: {
						x: 36,
						y: 100,
						width: 180,
						height: 18,
						padding: { left: 4, right: 4 },
					},
					dataBinding: {
						path: "$.taxpayer.firstName",
					},
					formatting: {
						textTransform: "uppercase",
					},
					validations: [
						{
							type: ValidationType.REQUIRED,
							message: "First name is required",
							severity: ValidationSeverity.ERROR,
						},
					],
					required: true,
				},

				// Last name field
				{
					id: "last_name",
					label: "Last name",
					dataType: FieldDataType.STRING,
					positioning: {
						x: 220,
						y: 100,
						width: 180,
						height: 18,
						padding: { left: 4, right: 4 },
					},
					dataBinding: {
						path: "$.taxpayer.lastName",
					},
					formatting: {
						textTransform: "uppercase",
					},
					validations: [
						{
							type: ValidationType.REQUIRED,
							message: "Last name is required",
							severity: ValidationSeverity.ERROR,
						},
					],
					required: true,
				},

				// SSN field
				{
					id: "ssn",
					label: "Social Security Number",
					dataType: FieldDataType.SSN,
					positioning: {
						x: 450,
						y: 100,
						width: 120,
						height: 18,
						padding: { left: 4 },
					},
					dataBinding: {
						path: "$.taxpayer.ssn",
					},
					formatting: {
						showSeparators: true,
						letterSpacing: 2,
					},
					validations: [
						{
							type: ValidationType.REQUIRED,
							message: "SSN is required",
							severity: ValidationSeverity.ERROR,
						},
						{
							type: ValidationType.PATTERN,
							message: "SSN must be 9 digits",
							pattern: "^\\d{9}$",
							severity: ValidationSeverity.ERROR,
						},
					],
					required: true,
				},

				// Total income field (currency)
				{
					id: "total_income",
					label: "Total income",
					lineNumber: "9",
					dataType: FieldDataType.CURRENCY,
					positioning: {
						x: 500,
						y: 200,
						width: 70,
						height: 14,
						padding: { right: 4 },
					},
					dataBinding: {
						path: "$.income.total",
						fallback: 0,
					},
					formatting: {
						horizontalAlign: HorizontalAlignment.RIGHT,
						currencyFormat: CurrencyFormat.USD_NO_SYMBOL,
						thousandsSeparator: true,
						decimalPlaces: 0,
					},
					stylePreset: "lineTotal",
				},
			],
		},
	],

	fieldGroups: [
		{
			id: "identity",
			name: "Taxpayer Identity",
			type: FieldGroupType.SECTION,
			fieldIds: ["first_name", "last_name", "ssn"],
			order: 1,
		},
		{
			id: "income",
			name: "Income",
			type: FieldGroupType.SECTION,
			fieldIds: ["total_income"],
			order: 2,
		},
	],
};

// ============================================================================
// EXAMPLE 5: Sample Taxpayer Data
// ============================================================================

/**
 * Example taxpayer data that would be provided by a tax calculation engine.
 */
const sampleTaxpayerData = {
	taxpayer: {
		firstName: "John",
		middleInitial: "A",
		lastName: "Smith",
		ssn: "123456789",
		dateOfBirth: "1985-03-15",
		occupation: "Software Engineer",
		email: "john.smith@email.com",
		phone: "555-123-4567",
	},

	spouse: {
		firstName: "Jane",
		middleInitial: "B",
		lastName: "Smith",
		ssn: "987654321",
		dateOfBirth: "1987-07-22",
		occupation: "Accountant",
	},

	address: {
		street: "123 Main Street",
		apartment: "Apt 4B",
		city: "Anytown",
		state: "CA",
		zipCode: "90210",
	},

	filingStatus: "married_filing_jointly",

	dependents: [
		{
			firstName: "Emily",
			lastName: "Smith",
			ssn: "111223333",
			relationship: "Daughter",
			dateOfBirth: "2015-05-10",
			monthsLived: 12,
			credits: {
				childTaxCredit: true,
				otherDependentCredit: false,
			},
		},
		{
			firstName: "Michael",
			lastName: "Smith",
			ssn: "444556666",
			relationship: "Son",
			dateOfBirth: "2018-11-20",
			monthsLived: 12,
			credits: {
				childTaxCredit: true,
				otherDependentCredit: false,
			},
		},
	],

	income: {
		w2Wages: 125000,
		w2Forms: [
			{ employer: "Tech Corp", wages: 80000, federalWithheld: 16000 },
			{ employer: "Consulting LLC", wages: 45000, federalWithheld: 9000 },
		],
		householdWages: 0,
		tipIncome: 0,
		taxableInterest: 1250,
		taxExemptInterest: 500,
		qualifiedDividends: 3500,
		ordinaryDividends: 4200,
		capitalGains: 15000,
		iraDistributions: 0,
		pensions: 0,
		socialSecurity: 0,
		total: 145450,
	},

	adjustments: {
		studentLoanInterest: 2500,
		hsaDeduction: 7300,
		iraDeduction: 0,
		total: 9800,
	},

	deductions: {
		type: "standard",
		standard: 29200,
		itemized: 0,
		total: 29200,
	},

	credits: {
		childTaxCredit: 4000,
		dependentCareCredit: 0,
		educationCredits: 0,
		total: 4000,
	},

	tax: {
		taxableIncome: 106450,
		taxFromTable: 17256,
		totalTax: 13256,
	},

	payments: {
		w2Withholding: 25000,
		estimatedPayments: 0,
		total: 25000,
	},

	refund: {
		overpaid: 11744,
		amount: 11744,
		directDeposit: {
			enabled: true,
			routingNumber: "123456789",
			accountNumber: "9876543210",
			accountType: "checking",
		},
	},

	amountOwed: 0,

	presidentialCampaign: {
		taxpayer: false,
		spouse: false,
	},

	digitalAssets: {
		received: false,
	},
};

// ============================================================================
// EXAMPLE 6: Using the System
// ============================================================================

/**
 * Demonstrates how to use the form annotation system.
 */
function demonstrateUsage(): void {
	console.log("=== Tax Form Annotation System Demo ===\n");

	// 1. Summarize the blueprint
	console.log("1. Blueprint Summary:");
	const summary = summarizeBlueprint(exampleBlueprint);
	console.log(JSON.stringify(summary, null, 2));
	console.log("");

	// 2. Resolve data values
	console.log("2. Resolving Data Values:");

	const firstName = resolveJSONPath("$.taxpayer.firstName", sampleTaxpayerData);
	console.log(`   First name: ${firstName}`);

	const totalIncome = resolveJSONPath("$.income.total", sampleTaxpayerData);
	console.log(`   Total income: ${formatCurrency(totalIncome as number)}`);

	const allW2Wages = resolveJSONPath(
		"$.income.w2Forms[*].wages",
		sampleTaxpayerData,
	);
	console.log(`   W-2 wages: ${JSON.stringify(allW2Wages)}`);

	const firstDependent = resolveJSONPath(
		"$.dependents[0].firstName",
		sampleTaxpayerData,
	);
	console.log(`   First dependent: ${firstDependent}`);
	console.log("");

	// 3. Format values
	console.log("3. Formatting Values:");

	const formattedCurrency = formatCurrency(
		125000.5,
		CurrencyFormat.USD_WITH_CENTS,
		2,
		true,
	);
	console.log(`   Currency (with cents): ${formattedCurrency}`);

	const formattedSSN = formatSSN("123456789", true, false);
	console.log(`   SSN (with dashes): ${formattedSSN}`);

	const maskedSSN = formatSSN("123456789", true, true);
	console.log(`   SSN (masked): ${maskedSSN}`);

	const formattedDate = formatDate(
		new Date("2025-04-15"),
		DateFormat.MM_DD_YYYY,
	);
	console.log(`   Date: ${formattedDate}`);
	console.log("");

	// 4. Validate form data
	console.log("4. Validating Form Data:");
	const validationResult = validateForm(exampleBlueprint, sampleTaxpayerData);
	console.log(`   Valid: ${validationResult.isValid}`);
	console.log(`   Errors: ${validationResult.errors.length}`);
	console.log(`   Warnings: ${validationResult.warnings.length}`);

	if (validationResult.errors.length > 0) {
		console.log("   Error details:");
		for (const error of validationResult.errors) {
			console.log(`     - ${error.fieldId}: ${error.message}`);
		}
	}
	console.log("");

	// 5. Get merged formatting
	console.log("5. Merged Formatting for Field:");
	const incomeField = findFieldById(exampleBlueprint, "total_income");
	if (incomeField) {
		const mergedFormatting = getMergedFormatting(exampleBlueprint, incomeField);
		console.log(
			`   Font: ${mergedFormatting.fontFamily} ${mergedFormatting.fontSize}pt`,
		);
		console.log(`   Weight: ${mergedFormatting.fontWeight}`);
		console.log(`   Align: ${mergedFormatting.horizontalAlign}`);
	}
	console.log("");

	// 6. Evaluate conditional logic
	console.log("6. Conditional Logic Evaluation:");

	const spouseCondition: ConditionalLogic = {
		conditions: [
			{
				source: "$.filingStatus",
				operator: ComparisonOperator.IN,
				value: ["married_filing_jointly", "married_filing_separately"],
			},
		],
		operator: LogicalOperator.AND,
		action: ConditionalAction.SHOW,
	};

	const shouldShowSpouse = evaluateConditionalLogic(
		spouseCondition,
		sampleTaxpayerData,
		exampleBlueprint,
	);
	console.log(`   Show spouse fields: ${shouldShowSpouse}`);

	// Change filing status and re-evaluate
	const singleFilerData = { ...sampleTaxpayerData, filingStatus: "single" };
	const shouldShowSpouseSingle = evaluateConditionalLogic(
		spouseCondition,
		singleFilerData,
		exampleBlueprint,
	);
	console.log(
		`   Show spouse fields (single filer): ${shouldShowSpouseSingle}`,
	);
	console.log("");

	console.log("=== Demo Complete ===");
}

// Run the demonstration
demonstrateUsage();

// ============================================================================
// EXPORTS
// ============================================================================

export {
	demonstrateUsage,
	exampleBlueprint,
	filingStatusSingle,
	sampleTaxpayerData,
	spouseSsnField,
	wagesField,
};
