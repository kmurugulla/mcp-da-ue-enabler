# Usage Examples

## Complete Workflow: Enabling UE in a Project

### 1. Initialize Universal Editor

```
Initialize Universal Editor in my project at /Users/kiranm/MySpace/Franklin/brightpath
```

This will:
- Create `ue/` folder structure
- Generate base configs (page, text, image, section)
- Install dependencies (merge-json-cli, npm-run-all, husky)
- Setup build scripts in package.json
- Setup git pre-commit hooks

### 2. List All Blocks

```
List all blocks in the brightpath project
```

Returns all blocks with their JS/CSS status.

### 3. Analyze a Specific Block

```
Analyze the quote block structure in brightpath project
```

Returns:
- Expected content structure (rows/columns)
- DOM transformations detected
- Whether it's a container block
- If it needs UE observers
- Complexity assessment

### 4. Generate Block Configuration

```
Generate UE configuration for the quote block in brightpath
```

Creates `ue/models/blocks/quote.json` with:
- Definitions (block registration)
- Models (editable fields)
- Filters (parent-child relationships)

### 5. Generate Configuration for All Blocks

```
For each block in brightpath:
1. Analyze its structure
2. Generate its UE configuration
```

### 6. Validate Setup

```
Validate Universal Editor setup in brightpath project
```

Checks:
- Folder structure
- Base config files
- Template files
- Build scripts
- Dependencies
- Git hooks

## Specific Use Cases

### Working with GitHub Repositories

```
List blocks from GitHub repository kmurugulla/brightpath
```

```
Analyze the accordion block from GitHub repository kmurugulla/brightpath on main branch
```

### Preview Before Writing

```
Generate UE configuration for the cards block in preview mode
```

Shows what would be generated without writing files.

### Custom Field Configuration

```
Generate UE configuration for accordion block with custom fields:
- Field 1: "Summary" (text)
- Field 2: "Details" (richtext)
```

### Batch Operations

```
Initialize UE and instrument all blocks in /path/to/project
```

Complete setup from scratch.

## Tool Reference

### Setup Tools

**ue_setup_initialize_project**
- Initialize complete UE infrastructure
- Parameters: projectPath, skipDependencies (optional), skipGitHooks (optional)

### Analysis Tools

**ue_analysis_list_blocks**
- List all blocks in project
- Parameters: projectPath, github (optional)

**ue_analysis_analyze_block_structure**
- Analyze block code structure
- Parameters: blockName, projectPath, github (optional)

### Generation Tools

**ue_generation_generate_base_configs**
- Generate all base UE configs
- Parameters: projectPath, blockNames (optional)

**ue_generation_generate_block_json**
- Generate block UE configuration
- Parameters: blockName, projectPath, preview (optional), customFields (optional), github (optional)

### Validation Tools

**ue_validation_validate_setup**
- Validate entire UE setup
- Parameters: projectPath

## Troubleshooting

### Missing GITHUB_TOKEN

If you see: "GITHUB_TOKEN environment variable not set"

Solution: Add your GitHub token to the MCP config:
```json
{
  "env": {
    "GITHUB_TOKEN": "ghp_your_token_here"
  }
}
```

### Blocks Directory Not Found

If you see: "Blocks directory not found"

Solution: Either:
1. Ensure you're in the correct project directory
2. Provide GitHub parameters to fetch from repository

### Build Scripts Failed

If build scripts fail to run:

Solution:
1. Ensure dependencies are installed: `npm install`
2. Check that package.json exists
3. Try running: `npm run build:json`

## Advanced Usage

### Custom Output Path

```
Generate UE configuration for hero block and save to custom path /tmp/hero.json
```

### Skip Dependency Installation

```
Initialize UE in project but skip dependency installation
```

Useful if you want to install dependencies manually.

### Skip Git Hooks

```
Initialize UE in project but skip git hooks setup
```

Useful if you don't want automatic builds on commit.

## Integration with DA Live Admin MCP

Combine with [mcp-da-live-admin](https://github.com/kmurugulla/mcp-da-live-admin) for complete workflow:

```
1. Initialize UE in brightpath project
2. Generate configs for all blocks
3. Set up block library in kmurugulla/brightpath with examples from homepage
4. Validate UE setup
```

This gives you:
- ✅ UE instrumentation (from mcp-aem-ue-enabler)
- ✅ Block documentation with examples (from mcp-da-live-admin)
- ✅ Complete Universal Editor environment

