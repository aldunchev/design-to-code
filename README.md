# Figma Design Token & Component Extractor

A Node.js + TypeScript CLI tool that extracts design tokens and structured component specifications from Figma files using the Figma REST API.

## Features

- 🎨 Extract design tokens (colors, typography, spacing, effects, etc.)
- 🧩 Extract component specifications with properties and variants
- 📄 Generate structured JSON files ready for downstream automation
- 🔗 Direct integration with Figma REST API
- ⚡ Fast and efficient data processing

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd figma-design-extractor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
# Get your Figma API token from: https://www.figma.com/developers/api#access-tokens
FIGMA_API_TOKEN=your_figma_token_here
```

## Usage

### Development Mode

```bash
# Extract from a Figma file
npm run dev <figma-file-key> [output-directory]

# Examples
npm run dev abc123def456
npm run dev abc123def456 ./my-tokens
```

### Production Build

```bash
# Build the project
npm run build

# Run the built version
npm start <figma-file-key> [output-directory]
```

## Getting Started

1. **Get your Figma API Token:**
   - Go to https://www.figma.com/developers/api#access-tokens
   - Generate a new personal access token
   - Add it to your `.env` file

2. **Find your Figma File Key:**
   - Open your Figma file in the browser
   - Copy the file key from the URL: `figma.com/file/<FILE_KEY>/...`

3. **Run the extractor:**
   ```bash
   npm run dev YOUR_FILE_KEY
   ```

## Output Files

The tool generates two JSON files:

### `design-tokens.json`
Contains extracted design tokens:
```json
{
  "color": {
    "primary": "#007AFF",
    "secondary": "#5AC8FA"
  },
  "typography": {
    "heading-xl": {
      "fontSize": 32,
      "fontWeight": 700,
      "lineHeight": 1.2
    }
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16
  }
}
```

### `component-specs.json`
Contains component specifications:
```json
{
  "components": [
    {
      "id": "button-component",
      "name": "Button",
      "type": "component",
      "properties": {
        "variant": ["primary", "secondary"],
        "size": ["sm", "md", "lg"]
      }
    }
  ],
  "version": "1.0",
  "lastModified": "2024-01-01T00:00:00Z"
}
```

## Project Structure

```
/src
  index.ts                 # CLI entry point
  /services
    figma-api.ts          # Figma REST API integration
    extractor.ts          # Main extraction orchestrator
  /processors
    tokenParser.ts        # Design token extraction logic
    componentParser.ts    # Component specification extraction
  /config
    index.ts             # Configuration and environment setup
  /schemas
    design-tokens.schema.json    # JSON schema for design tokens
    component-specs.schema.json  # JSON schema for component specs
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIGMA_API_TOKEN` | Your Figma personal access token | Yes |

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev <file-key>

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## API Endpoints Used

The tool uses these Figma REST API endpoints:

- `GET /v1/files/:file_key` - Fetch file node tree
- `GET /v1/files/:file_key/styles` - Fetch fill, stroke, effect, text styles
- `GET /v1/components` - Fetch published component metadata

## License

MIT License
