# Generate UE Configurations for DA Projects

An MCP (Model Context Protocol) server for enabling and managing Universal Editor in AEM Edge Delivery projects. This server automates the complex process of instrumenting blocks for Universal Editor, analyzing code structure, and generating configurations.

## Features

* **Setup & Initialization**
  - Initialize UE in existing AEM projects
  - Install dependencies automatically
  - Create folder structure (`ue/models/`, `ue/scripts/`)
  - Setup build scripts and git hooks

* **Block Analysis**
  - Auto-detect blocks from local or GitHub
  - Analyze block JavaScript structure
  - Detect DOM transformations (e.g., `div` → `details`, `div` → `ul/li`)
  - Identify container patterns
  - Extract expected row/column structure

* **Configuration Generation**
  - Generate block JSON configurations (definitions, models, filters)
  - Create base configs (page, text, image, section)
  - Generate UE observers for DOM-mutating blocks
  - Create section filters automatically
  - Smart field type detection

* **Instrumentation**
  - Instrument individual blocks (auto, assisted, or manual mode)
  - Batch instrument all blocks with priority strategies
  - Auto-register blocks in section filters
  - Generate documentation

* **Validation & Testing**
  - Validate entire UE setup
  - Check JSON schema compliance
  - Verify folder structure
  - Report missing dependencies

## Environment Variables

### GitHub Token Setup (Optional)

To analyze blocks from GitHub repositories or work with private repos:

1. Go to: https://github.com/settings/tokens/new
2. Set token name (e.g., "AEM UE Enabler - Read Only")
3. **Select scope:**
   - For **public repos**: `public_repo`
   - For **private repos**: `repo`
4. Generate token and copy it
5. Add to MCP config: `"GITHUB_TOKEN": "ghp_your_token_here"`

**Note:** The token is only used to read block code from repositories. No write access is ever used.

## Cursor AI Setup

To use this MCP server with Cursor AI:

1. Go to `Cursor Settings` → `MCP`
2. Add a `New global MCP server`
3. Add this configuration:

```json
{
  "aem-ue-enabler": {
    "command": "npx",
    "args": [
      "mcp-aem-ue-enabler"
    ],
    "env": {
      "GITHUB_TOKEN": "ghp_your_token_here"
    }
  }
}
```

For local development:

```json
{
  "aem-ue-enabler": {
    "command": "node",
    "args": [
      "/Users/kiranm/MySpace/Development/ai/mcp/mcp-aem-ue-enabler/src/index.js"
    ],
    "env": {
      "GITHUB_TOKEN": "ghp_your_token_here"
    }
  }
}
```

## Usage Examples

### Initialize UE in a project:
```
Initialize Universal Editor in my project at /Users/kiranm/MySpace/Franklin/brightpath
```

### List all blocks:
```
List all blocks in the brightpath project
```

### Analyze a specific block:
```
Analyze the quote block structure in brightpath project
```

### Generate block JSON configuration:
```
Generate UE configuration for the quote block in brightpath
```

### Instrument a single block (assisted mode):
```
Instrument the accordion block in brightpath project with assisted mode
```

### Batch instrument all blocks:
```
Instrument all blocks in brightpath, starting with simple blocks first
```

### Validate setup:
```
Validate Universal Editor setup in brightpath project
```

## Tool Categories

### Setup Tools
- `ue_setup_initialize_project` - Initialize complete UE infrastructure
- `ue_setup_install_dependencies` - Install required npm packages
- `ue_setup_create_folder_structure` - Create ue/ directories
- `ue_setup_setup_git_hooks` - Setup Husky pre-commit hook

### Analysis Tools
- `ue_analysis_list_blocks` - List all blocks in project
- `ue_analysis_analyze_block_structure` - Analyze block code structure
- `ue_analysis_detect_dom_mutations` - Detect DOM transformations
- `ue_analysis_get_block_dependencies` - Find block dependencies

### Generation Tools
- `ue_generation_generate_base_configs` - Generate page/text/image/section configs
- `ue_generation_generate_block_json` - Generate block UE configuration
- `ue_generation_generate_section_config` - Update section filters
- `ue_generation_generate_ue_observers` - Generate UE observer code

### Instrumentation Tools
- `ue_instrumentation_instrument_block` - Complete single block workflow
- `ue_instrumentation_batch_instrument_blocks` - Instrument multiple blocks
- `ue_instrumentation_update_section_filters` - Add blocks to section

### Validation Tools
- `ue_validation_validate_setup` - Validate entire UE setup
- `ue_validation_validate_json_config` - Validate JSON schema
- `ue_validation_check_dependencies` - Check npm dependencies

### Utility Tools
- `ue_utils_build_json_bundles` - Build consolidated JSON files
- `ue_utils_generate_documentation` - Generate UE documentation

## Architecture

```
src/
├── index.js                    # Main MCP server entry
├── tools/                      # MCP tool implementations
│   ├── setup/                  # Project setup tools
│   ├── analysis/               # Block analysis tools
│   ├── generation/             # Config generation tools
│   ├── instrumentation/        # Block instrumentation tools
│   ├── validation/             # Validation tools
│   └── utils/                  # Utility tools
├── lib/                        # Shared libraries
│   ├── block-analyzer.js       # Block code analysis
│   ├── json-generator.js       # JSON config generation
│   ├── github-client.js        # GitHub API client
│   ├── file-system.js          # File operations
│   └── validators.js           # Validation utilities
├── templates/                  # Configuration templates
│   ├── base-configs/           # Base UE configs
│   ├── block-configs/          # Block config templates
│   ├── scripts/                # UE script templates
│   └── hooks/                  # Git hook templates
└── constants/                  # Constants and schemas
    ├── ue-field-types.js       # UE field type definitions
    ├── block-patterns.js       # Common block patterns
    └── css-selectors.js        # CSS selector utilities
```

## Development Workflow

### Local Development

```bash
# Clone the repository
git clone https://github.com/kmurugulla/mcp-aem-ue-enabler.git
cd mcp-aem-ue-enabler

# Install dependencies
npm install

# Run locally
npm start

# Test with Cursor
# Update Cursor MCP config to point to local path
```

### Testing

```bash
# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## How It Works

### 1. Project Initialization
The tool scans your AEM project, installs required dependencies (merge-json-cli, npm-run-all, husky), creates the `ue/models/` structure, and sets up build scripts.

### 2. Block Analysis
For each block, the tool:
- Reads the JavaScript file
- Parses the AST (Abstract Syntax Tree)
- Detects how the block accesses `block.children`
- Identifies DOM transformations
- Determines if it's a container block

### 3. Configuration Generation
Based on analysis, it generates:
- **Definitions**: Block registration for UE
- **Models**: Editable fields with CSS selectors
- **Filters**: Parent-child relationships for containers

### 4. Observer Generation
For blocks that transform DOM, it generates MutationObserver code to preserve UE instrumentation attributes.

## Example: Accordion Block Instrumentation

**Input (accordion.js):**
```javascript
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const body = row.children[1];
    const details = document.createElement('details');
    // ... transforms div → details
  });
}
```

**Output (ue/models/blocks/accordion.json):**
```json
{
  "definitions": [{
    "title": "Accordion Item",
    "id": "accordion-item",
    "plugins": {
      "da": {
        "name": "accordion-item",
        "rows": 2,
        "columns": 0
      }
    }
  }],
  "models": [{
    "id": "accordion-item",
    "fields": [
      {
        "component": "richtext",
        "name": "div:nth-child(1)",
        "label": "Summary"
      },
      {
        "component": "richtext",
        "name": "div:nth-child(2)",
        "label": "Body"
      }
    ]
  }],
  "filters": [{
    "id": "accordion",
    "components": ["accordion-item"]
  }]
}
```

## Troubleshooting

### "GITHUB_TOKEN not set" error
- Add your GitHub token to the MCP config environment variables
- Token is optional if you're only working with local files

### "Failed to analyze block structure"
- Ensure block JavaScript follows standard AEM patterns
- Check that the block file exists and is readable
- Complex blocks may need manual review

### "Build scripts failed"
- Run `npm install` in your AEM project
- Ensure `merge-json-cli` and `npm-run-all` are installed
- Check that `package.json` exists

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Related Projects

- [mcp-da-live-admin](https://github.com/kmurugulla/mcp-da-live-admin) - MCP server for DA.live admin operations
- [AEM Boilerplate](https://github.com/adobe/aem-boilerplate) - AEM Edge Delivery boilerplate
- [DA Block Collection](https://github.com/aemsites/da-block-collection) - Reference UE implementation

## License

MIT

## Acknowledgments

- Built following patterns from [mcp-da-live-admin](https://github.com/kmurugulla/mcp-da-live-admin)
- Based on Adobe's Universal Editor documentation: https://docs.da.live/developers/reference/universal-editor
- Inspired by the DA Block Collection project


