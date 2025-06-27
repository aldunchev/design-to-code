I want you to build a Node.js + TypeScript CLI or service that extracts design tokens and structured component specs from a Figma file.

The output should be two JSON files:

1. `design-tokens.json`: holds tokens like color, typography, spacing, shadows, etc.
2. `component-specs.json`: following the schema from Figma

Use the Figma REST API and generate a well-structured and maintainable codebase with the following requirements:

---

✅ **PROJECT GOAL**

Extract design tokens and components from a Figma file via API and export structured JSON files to be used in Tailwind/Next.js development.

---

✅ **INPUTS**

- Figma File ID (via CLI or input field)
- My Figma API token (as env variable)
- Optional: Figma File URL

---

✅ **OUTPUTS**

- `design-tokens.json`
- `component-specs.json`

Each file must be schema-compliant and ready for downstream automation (e.g., Cursor codegen, Tailwind config generation).

---

✅ **STACK**

- Node.js + TypeScript
- Axios for HTTP
- `dotenv` for secrets

---

✅ **ESSENTIAL FOLDER STRUCTURE**
/src
index.ts
/services
figma-api.ts
extractor.ts
/processors
tokenParser.ts
componentParser.ts
/utils
/config
/schemas
design-tokens.schema.json
component-specs.schema.json
.env
README.md


---

✅ **FIGMA API INTEGRATION**

Use these endpoints:
- `GET /v1/files/:file_key` → node tree
- `GET /v1/files/:file_key/styles` → fill, stroke, effect, text styles
- `GET /v1/components` → published component metadata

Use access token in Authorization header.

---

✅ **DESIGN TOKENS EXTRACTOR**

Extract:
- Colors: fills, strokes, gradients
- Typography: fontFamily, fontWeight, fontSize, lineHeight
- Spacing/layout: padding, margin
- Effects: shadows
- Border radius and stroke weights

Format output as:

```json
{
  "color": {
    "primary": "#007AFF",
    "accent": "#F43F5E"
  },
  "typography": {
    "heading-xl": {
      "fontSize": 32,
      "fontWeight": 700
    }
  },
  ...
}
