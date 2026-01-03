# Tax Form Annotation System

## Problem Analysis & Design Document

**Version:** 1.0.0  
**Author:** Instead Product Team  
**Date:** January 3, 2026

---

## Table of Contents

1. [Problem Analysis](#1-problem-analysis)
2. [System Design Overview](#2-system-design-overview)
3. [JSON Schema Specification](#3-json-schema-specification)
4. [Developer Guide](#4-developer-guide)
5. [Rendering Engine Integration](#5-rendering-engine-integration)
6. [Future Enhancements](#6-future-enhancements)

---

## 1. Problem Analysis

### 1.1 Problem Restatement

The core challenge is to create a **machine-readable specification** that enables automated, precise overlay of taxpayer data onto physical U.S. tax forms (PDFs or scanned images). 

A typical tax form like IRS Form 1040 contains hundreds of fillable boxes, each with specific:
- **Spatial requirements** (exact position and size on the page)
- **Data type expectations** (currency, SSN, checkboxes, dates)
- **Formatting rules** (decimal places, uppercase, alignment)
- **Validation constraints** (required fields, value ranges, cross-field dependencies)
- **Conditional visibility** (certain fields appear only when specific conditions are met)

The system must serve as a **universal contract** between:
- **Tax calculation engines** (which produce taxpayer data)
- **Rendering engines** (which print values onto forms)
- **Form designers** (who create and maintain field definitions)

### 1.2 Core Requirements

| Requirement | Description | Priority |
|-------------|-------------|----------|
| **Precise Positioning** | Define exact x, y, width, height for each field in consistent coordinate system | Critical |
| **Type Safety** | Strong typing for data types (currency, SSN, checkbox, date, etc.) | Critical |
| **Deep Data Binding** | JSONPath-like syntax to navigate nested taxpayer data | Critical |
| **Formatting Control** | Currency formatting, date patterns, text transformation | Critical |
| **Multi-Page Support** | Forms span multiple pages with cross-page references | High |
| **Conditional Rendering** | Fields that appear/hide based on other values | High |
| **Validation Rules** | Declarative validation with error messages | High |
| **Repeatable Sections** | Support for dependents, W-2s, and other repeating data | High |
| **Version Control** | Track schema versions and form blueprint versions | High |
| **Backward Compatibility** | New schema versions must not break existing blueprints | Medium |
| **Auditing** | Metadata for debugging and compliance | Medium |
| **Extensibility** | Allow custom properties without breaking the schema | Medium |

### 1.3 Edge Cases & Challenges

#### Multi-Page Forms
- IRS Form 1040 is 2 pages, but with schedules can span 20+ pages
- Field references may cross page boundaries (e.g., "Amount from line 11")
- Repeating sections may overflow to continuation pages

**Solution:** Each page is a distinct object with unique field IDs. Cross-references use field IDs, not positions. Overflow rules define continuation behavior.

#### Text Overflow
- Form boxes have fixed dimensions; long names may not fit
- Currency values can exceed box width ($1,000,000,000)

**Solution:** Configurable overflow strategies:
- `truncate` - Cut off with optional ellipsis
- `wrap` - Allow multiple lines
- `scale_to_fit` - Reduce font size (with minimum threshold)
- `error` - Fail validation if content doesn't fit

#### Conditional Fields
- "Spouse's SSN" only required if filing status is "Married Filing Jointly"
- Box locations may shift in different form versions

**Solution:** Declarative conditional logic using expressions that reference other fields or data paths. Actions include show/hide, enable/disable, require/optional.

#### Repeating Sections
- Up to 4 dependents on Form 1040 page 1
- Unlimited dependents require Schedule 8812
- Each W-2 form has the same fields but different instances

**Solution:** `FieldGroup` with `type: 'repeatable'` defines templates with offset calculations. `repeatSource` points to the data array.

#### Form Version Changes
- IRS updates forms annually
- Box positions shift, new lines are added
- Old data must render on old forms

**Solution:** Form blueprints are versioned independently from the schema. Blueprints reference specific form versions (e.g., `irs-form-1040-2025`). Historical blueprints are archived, not deleted.

### 1.4 Design Tradeoffs

| Decision | Tradeoff | Rationale |
|----------|----------|-----------|
| **JSON over XML** | Less verbose but no native schema validation | JSON is more widely supported in modern tooling; JSON Schema provides validation |
| **JSONPath for data binding** | Powerful but complex for simple cases | Enables deep navigation without custom syntax; simpler cases remain simple |
| **Points as default units** | Not intuitive but PDF-native | 72 points per inch matches PDF coordinate system; conversions available |
| **Separate enums from interfaces** | More files but cleaner organization | Enables tree-shaking, clearer imports, easier maintenance |
| **Flat field array vs. nested structure** | Less structural but more flexible | Forms don't always follow logical groupings; fieldGroups provide optional organization |
| **Optional style presets** | Extra complexity | Reduces redundancy across 50+ similar currency fields |

### 1.5 Why JSON is Suitable

1. **Language Agnostic:** JSON can be consumed by any programming language—TypeScript, Python, Java, Go, C#
2. **Human Readable:** Developers can inspect and manually edit blueprints
3. **Tooling Ecosystem:** JSON Schema, validators, formatters, and editors are mature
4. **Serialization:** Easy to store in databases, transmit over APIs, and version in Git
5. **Evolution Strategy:**
   - `schemaVersion` enables backward compatibility checks
   - New optional properties don't break old consumers
   - Required property additions trigger major version bumps
   - Deprecated properties include migration notes

---

## 2. System Design Overview

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TAX FORM ANNOTATION SYSTEM                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐ │
│  │   TAXPAYER   │     │     FORM     │     │     RENDERING        │ │
│  │    DATA      │────▶│   BLUEPRINT  │────▶│       ENGINE         │ │
│  │   (JSON)     │     │   (JSON)     │     │   (Proprietary)      │ │
│  └──────────────┘     └──────────────┘     └──────────────────────┘ │
│         │                    │                       │              │
│         │                    │                       ▼              │
│         │                    │              ┌──────────────────┐    │
│         │                    │              │   FILLED FORM    │    │
│         │                    │              │   (PDF/Image)    │    │
│         ▼                    ▼              └──────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    JSON PATH RESOLVER                       │    │
│  │   $.taxpayer.firstName    →    "JOHN"                       │    │
│  │   $.income.w2Forms[*].wages   →    [52000, 48000]           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
1. TAX ENGINE produces Taxpayer Data (structured JSON)
        │
        ▼
2. BLUEPRINT SELECTOR chooses correct form version
        │
        ▼
3. DATA MAPPER resolves JSONPath expressions to actual values
        │
        ▼
4. VALIDATOR checks all validation rules
        │
        ▼
5. FORMATTER applies formatting rules (currency, dates, etc.)
        │
        ▼
6. CONDITIONAL EVALUATOR determines field visibility
        │
        ▼
7. RENDERING ENGINE places formatted values at specified coordinates
        │
        ▼
8. OUTPUT: Filled PDF or printed document
```

### 2.3 Versioning Strategy

#### Schema Versioning
The `schemaVersion` field in every blueprint indicates which version of the annotation schema it conforms to. This follows semantic versioning:

- **MAJOR (1.x.x → 2.x.x):** Breaking changes to required fields or type definitions
- **MINOR (1.0.x → 1.1.x):** New optional fields or capabilities
- **PATCH (1.0.0 → 1.0.1):** Documentation or non-functional changes

#### Blueprint Versioning
Each form blueprint has its own `version` field:

```json
{
  "id": "irs-form-1040-2025",
  "version": "1.2.0",
  "schemaVersion": "1.0.0"
}
```

This allows:
- Multiple versions of the same form to coexist
- Rollback to previous field definitions
- A/B testing of positioning adjustments

### 2.4 Backward Compatibility

| Change Type | Impact | Migration |
|-------------|--------|-----------|
| Add optional field | None | Rendering engine ignores unknown fields |
| Add required field | Breaking | Major version bump; existing blueprints invalid |
| Remove field | Warning | Deprecated flag first; remove in next major |
| Change field type | Breaking | New field with migration period |
| Change positioning | None | Blueprint version bump only |

### 2.5 Field Grouping & Reusability

```
FormBlueprint
├── pages[]
│   ├── Page 1
│   │   └── fields[]
│   │       ├── taxpayer_first_name
│   │       ├── taxpayer_last_name
│   │       └── ... (50+ fields)
│   └── Page 2
│       └── fields[]
│           └── ... (40+ fields)
│
├── fieldGroups[]
│   ├── "header" (section)
│   ├── "taxpayer_info" (section)
│   ├── "income" (section)
│   ├── "dependents" (repeatable)
│   └── ...
│
└── stylePresets
    ├── "lineTotal"
    ├── "sectionHeader"
    └── "smallText"
```

---

## 3. JSON Schema Specification

### 3.1 Root Structure

```typescript
interface FormBlueprint {
  id: string;              // "irs-form-1040-2025"
  version: string;         // "1.0.0" (blueprint version)
  schemaVersion: string;   // "1.0.0" (schema version)
  metadata: FormMetadata;
  coordinateSystem: CoordinateSystemDefinition;
  pages: PageDefinition[];
  fieldGroups?: FieldGroup[];
  globalStyles?: GlobalStyleDefinition;
  stylePresets?: Record<string, Partial<FormattingRules>>;
  globalValidations?: ValidationRule[];
  transformers?: TransformerDefinition[];
}
```

### 3.2 Coordinate System

```typescript
interface CoordinateSystemDefinition {
  unit: 'points' | 'pixels' | 'percentage' | 'inches' | 'millimeters';
  origin: 'top-left' | 'bottom-left';
  dpi?: number;           // Required for pixel coordinates
  referenceWidth?: number;
  referenceHeight?: number;
}
```

**Standard PDF Coordinates:**
- Unit: points (72 points = 1 inch)
- Origin: top-left (matches screen coordinates)
- Letter paper: 612 × 792 points (8.5" × 11")

### 3.3 Field Annotation

```typescript
interface FieldAnnotation {
  id: string;                    // Unique identifier
  label: string;                 // Human-readable label
  lineNumber?: string;           // IRS line reference ("1a", "11")
  dataType: FieldDataType;       // 'string' | 'currency' | 'checkbox' | ...
  positioning: Positioning;       // x, y, width, height
  dataBinding: DataBinding;      // How to get the value
  formatting?: FormattingRules;  // How to display the value
  validations?: ValidationRule[];
  conditionalLogic?: ConditionalLogic;
  stylePreset?: string;          // Reference to defined preset
  groupId?: string;              // Which group this belongs to
  required?: boolean;
  readOnly?: boolean;
  defaultValue?: string | number | boolean;
  helpText?: string;
  zIndex?: number;
  meta?: FieldMetadata;
}
```

### 3.4 Data Binding

```typescript
interface DataBinding {
  path: string;                  // JSONPath expression
  transform?: string;            // Transformer reference
  transformParams?: Record<string, unknown>;
  fallback?: string | number | boolean;
  checkedValue?: string | number | boolean;  // For checkboxes
  repeatSource?: string;         // For repeatable fields
  expression?: CalculationExpression;
}
```

#### JSONPath Examples

| Expression | Description | Example Value |
|------------|-------------|---------------|
| `$.taxpayer.firstName` | Simple property | `"JOHN"` |
| `$.dependents[0].ssn` | Array index | `"123-45-6789"` |
| `$.income.w2Forms[*].wages` | All wages | `[52000, 48000]` |
| `$.filingStatus` | Enum value | `"married_filing_jointly"` |

### 3.5 Formatting Rules

```typescript
interface FormattingRules {
  // Typography
  fontFamily?: string;           // 'Courier', 'Arial'
  fontSize?: number;             // In points
  fontWeight?: FontWeight;       // 400 (regular), 700 (bold)
  fontStyle?: FontStyle;         // 'normal', 'italic'
  textColor?: string;            // '#000000'
  
  // Alignment
  horizontalAlign?: HorizontalAlignment;  // 'left', 'right', 'center'
  verticalAlign?: VerticalAlignment;      // 'top', 'middle', 'bottom'
  
  // Text handling
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  overflow?: OverflowBehavior;   // 'truncate', 'wrap', 'scale_to_fit'
  minFontSize?: number;          // For scale_to_fit
  maxLines?: number;             // For wrap
  
  // Type-specific
  currencyFormat?: CurrencyFormat;
  decimalPlaces?: number;
  thousandsSeparator?: boolean;
  dateFormat?: DateFormat;
  checkboxStyle?: CheckboxStyle;
  checkboxCharacter?: string;
  showSeparators?: boolean;      // For SSN/EIN
  maskValue?: boolean;           // Hide sensitive data
}
```

---

## 4. Developer Guide

### 4.1 How to Add a New Field

**Step 1: Identify the field location**

Using a PDF viewer or image editor, measure the field's position:
- X: Distance from left edge
- Y: Distance from top edge
- Width: Field width
- Height: Field height

Convert to points if necessary (72 points = 1 inch, 1 pixel at 72 DPI = 1 point).

**Step 2: Define the field in the page's fields array**

```json
{
  "id": "line_42_new_tax_credit",
  "label": "New Tax Credit (see instructions)",
  "lineNumber": "42",
  "dataType": "currency",
  "positioning": {
    "x": 522,
    "y": 456,
    "width": 54,
    "height": 12,
    "padding": {
      "right": 4
    }
  },
  "dataBinding": {
    "path": "$.credits.newTaxCredit",
    "fallback": 0
  },
  "formatting": {
    "horizontalAlign": "right",
    "currencyFormat": "USD_NO_SYMBOL",
    "thousandsSeparator": true,
    "decimalPlaces": 0
  },
  "groupId": "tax_credits",
  "validations": [
    {
      "type": "range",
      "message": "Credit cannot exceed $5,000",
      "min": 0,
      "max": 5000
    }
  ]
}
```

**Step 3: Add to appropriate field group (optional)**

```json
{
  "fieldGroups": [
    {
      "id": "tax_credits",
      "name": "Tax Credits",
      "type": "section",
      "fieldIds": [..., "line_42_new_tax_credit"]
    }
  ]
}
```

**Step 4: Increment blueprint version**

```json
{
  "version": "1.1.0"  // Minor version bump for new field
}
```

### 4.2 How to Support a New Form Version

**Step 1: Create a new blueprint file**

```
examples/
├── form-1040-2024.json
├── form-1040-2025.json    ← Current
└── form-1040-2026.json    ← New
```

**Step 2: Update metadata**

```json
{
  "id": "irs-form-1040-2026",
  "version": "1.0.0",
  "metadata": {
    "taxYear": 2026,
    "revisionDate": "2026-09-01",
    ...
  }
}
```

**Step 3: Adjust field positions**

Compare the new form PDF with the previous version. Update changed positions:

```diff
{
  "id": "taxpayer_first_name",
  "positioning": {
-   "y": 84,
+   "y": 90,
    ...
  }
}
```

**Step 4: Add/remove fields as needed**

New IRS lines require new field definitions. Removed lines should be deleted.

**Step 5: Update background source**

```json
{
  "backgroundSource": "assets/forms/1040-2026-page1.pdf"
}
```

### 4.3 How to Change Positioning Safely

1. **Never modify coordinates in production without testing**
2. **Use a test rendering to verify alignment**
3. **Document the change in field metadata**

```json
{
  "id": "taxpayer_ssn",
  "positioning": {
    "x": 470,  // Changed from 468
    "y": 84,
    "width": 108,
    "height": 18
  },
  "meta": {
    "notes": "Adjusted x by 2pt to better center in box - 2026-01-03",
    "lastModified": "2026-01-03T10:00:00Z",
    "modifiedBy": "jsmith"
  }
}
```

**Best Practices:**
- Make small adjustments (1-2 points)
- Test with boundary values ("WWWWWW..." for names, "$999,999,999" for currency)
- Verify across different PDF viewers
- Consider DPI variations in printing

### 4.4 Coordinate Interpretation Guide

#### Origin Systems

**Top-Left Origin (Recommended):**
```
(0,0) ─────────────────▶ X
  │
  │   ┌─────────────┐
  │   │  Field at   │
  │   │  (100, 200) │
  │   └─────────────┘
  ▼
  Y
```

**Bottom-Left Origin (PDF Native):**
```
  Y
  ▲
  │
  │   ┌─────────────┐
  │   │  Field at   │
  │   │  (100, 592) │
  │   └─────────────┘
  │
(0,0) ─────────────────▶ X
```

**Conversion:**
```
Y_bottom_left = PageHeight - Y_top_left - FieldHeight
```

#### Unit Conversions

| From | To Points | Formula |
|------|-----------|---------|
| Inches | Points | `inches × 72` |
| Millimeters | Points | `mm × 2.835` |
| Pixels (at N DPI) | Points | `pixels × (72 / N)` |

### 4.5 Validation Error Handling

**Validation Flow:**

```
1. Parse and type-check data
2. Evaluate each field's validation rules
3. Collect all errors/warnings
4. Return structured response
```

**Error Response Structure:**

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationError {
  fieldId: string;
  lineNumber?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  rule: ValidationType;
  actualValue?: unknown;
  expectedValue?: unknown;
}
```

**Example Error:**

```json
{
  "isValid": false,
  "errors": [
    {
      "fieldId": "taxpayer_ssn",
      "lineNumber": "SSN",
      "message": "Social Security Number is required",
      "severity": "error",
      "rule": "required",
      "actualValue": null
    },
    {
      "fieldId": "line_35b_routing_number",
      "lineNumber": "35b",
      "message": "Routing number must be 9 digits",
      "severity": "error",
      "rule": "pattern",
      "actualValue": "1234567",
      "expectedValue": "^\\d{9}$"
    }
  ],
  "warnings": [
    {
      "fieldId": "taxpayer_first_name",
      "message": "Name may not fit in box; consider abbreviations",
      "severity": "warning",
      "rule": "max_length"
    }
  ]
}
```

**Handling Strategies:**

| Severity | Rendering Behavior | User Action |
|----------|-------------------|-------------|
| Error | Block rendering; show message | Must fix before submitting |
| Warning | Render but flag | Review recommended |
| Info | Render normally | Informational only |

---

## 5. Rendering Engine Integration

### 5.1 Engine Requirements

A compatible rendering engine must:

1. **Parse JSON blueprints** according to the schema
2. **Resolve JSONPath expressions** from taxpayer data
3. **Apply formatting rules** to raw values
4. **Evaluate conditional logic** for visibility/state
5. **Position text** using the coordinate system
6. **Handle overflow** according to specified strategies
7. **Support checkboxes** with configurable styles
8. **Produce output** (PDF, image, or print stream)

### 5.2 Rendering Algorithm

```pseudocode
function renderForm(blueprint: FormBlueprint, data: TaxpayerData): RenderedForm {
  result = new RenderedForm()
  
  for each page in blueprint.pages:
    pageOutput = new RenderedPage(page.backgroundSource)
    
    for each field in page.fields:
      // 1. Check conditional visibility
      if field.conditionalLogic:
        if not evaluateCondition(field.conditionalLogic, data, blueprint):
          continue  // Skip hidden fields
      
      // 2. Resolve data value
      rawValue = resolveJSONPath(field.dataBinding.path, data)
      
      // 3. Apply fallback if needed
      if rawValue is null:
        rawValue = field.dataBinding.fallback ?? field.defaultValue ?? ''
      
      // 4. Apply transformer
      if field.dataBinding.transform:
        rawValue = applyTransformer(
          field.dataBinding.transform, 
          rawValue,
          field.dataBinding.transformParams
        )
      
      // 5. Format value
      formattedValue = formatValue(rawValue, field.dataType, field.formatting)
      
      // 6. Calculate text metrics
      metrics = measureText(formattedValue, field.formatting)
      
      // 7. Handle overflow
      if metrics.width > field.positioning.width:
        formattedValue = handleOverflow(
          formattedValue, 
          field.formatting.overflow,
          field.positioning,
          field.formatting
        )
      
      // 8. Position and render
      pageOutput.addText(
        formattedValue,
        field.positioning.x + getPadding(field, 'left'),
        field.positioning.y + getPadding(field, 'top'),
        field.formatting
      )
    
    result.addPage(pageOutput)
  
  return result
}
```

### 5.3 Checkbox Rendering

Checkboxes require special handling:

```pseudocode
function renderCheckbox(field: FieldAnnotation, data: TaxpayerData): void {
  value = resolveJSONPath(field.dataBinding.path, data)
  isChecked = (value === field.dataBinding.checkedValue)
  
  if isChecked:
    character = field.formatting.checkboxCharacter ?? getDefaultCharacter(field.formatting.checkboxStyle)
    // Center the character in the checkbox area
    centerX = field.positioning.x + (field.positioning.width / 2)
    centerY = field.positioning.y + (field.positioning.height / 2)
    renderText(character, centerX, centerY, {
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      fontWeight: 700
    })
}
```

### 5.4 Currency Formatting

```typescript
function formatCurrency(
  value: number,
  format: CurrencyFormat,
  decimalPlaces: number = 0,
  thousandsSeparator: boolean = true
): string {
  const absValue = Math.abs(value);
  const negative = value < 0;
  
  let formatted = absValue.toFixed(decimalPlaces);
  
  if (thousandsSeparator) {
    formatted = addThousandsSeparators(formatted);
  }
  
  switch (format) {
    case 'USD':
      formatted = `$${formatted}`;
      break;
    case 'USD_NO_SYMBOL':
      // Already formatted
      break;
    case 'USD_WITH_CENTS':
      formatted = absValue.toFixed(2);
      if (thousandsSeparator) formatted = addThousandsSeparators(formatted);
      break;
    case 'USD_WHOLE':
      formatted = Math.round(absValue).toString();
      if (thousandsSeparator) formatted = addThousandsSeparators(formatted);
      break;
  }
  
  return negative ? `(${formatted})` : formatted;
}
```

---

## 6. Future Enhancements

### 6.1 Planned Improvements

| Feature | Description | Status |
|---------|-------------|--------|
| **Visual Editor** | GUI tool for creating/editing blueprints | Future |
| **Automated Positioning** | OCR-based field detection from PDFs | Future |
| **Localization** | Support for non-English forms | Future |
| **Digital Signatures** | Embedded signature fields | Future |
| **Barcode Support** | 2D barcodes for e-filing | Future |
| **Accessibility** | Screen reader annotations | Future |

### 6.2 Extension Points

The schema supports custom extensions via:

1. **`meta.customProperties`** on fields
2. **Custom transformers** in the `transformers` array
3. **Custom validation types** with `CUSTOM` validator

---

## Appendix A: TypeScript Types Reference

See `src/types/` directory for complete type definitions:

- `enums.ts` - All enumerated values
- `interfaces.ts` - All interfaces
- `index.ts` - Utility types and exports

## Appendix B: Example Data Structure

Rendering engines expect taxpayer data in this shape:

```typescript
interface TaxpayerData {
  taxpayer: {
    firstName: string;
    lastName: string;
    ssn: string;
    occupation?: string;
    isDeceased?: boolean;
    deceasedDate?: string;
  };
  spouse?: {
    firstName: string;
    lastName: string;
    ssn: string;
    occupation?: string;
    isDeceased?: boolean;
    deceasedDate?: string;
  };
  address: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  filingStatus: FilingStatus;
  dependents?: Dependent[];
  income: {
    w2Wages: number;
    taxableInterest: number;
    // ... other income fields
  };
  // ... other sections
}
```

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Blueprint** | Complete JSON definition of a form's field annotations |
| **Field Annotation** | Specification for a single fillable area on the form |
| **Positioning** | X, Y, width, height coordinates for a field |
| **Data Binding** | JSONPath expression linking a field to source data |
| **Transformer** | Function that converts raw data to a displayable value |
| **Conditional Logic** | Rules that control field visibility or state |
| **Schema Version** | Version of the annotation specification format |
| **Blueprint Version** | Version of a specific form's field definitions |
