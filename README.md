# Generate UE Configurations for DA Projects

An MCP (Model Context Protocol) server for enabling and managing Universal Editor in AEM Edge Delivery projects. This server automates the process of analyzing blocks, generating configurations, and setting up Universal Editor infrastructure.

## Installation

### Cursor AI Setup

1. Go to `Cursor Settings` → `MCP`
2. Add a `New global MCP server`
3. Add this configuration:

```json
{
  "da-ue-enabler": {
    "command": "npx",
    "args": [
      "https://github.com/kmurugulla/mcp-da-ue-enabler"
    ]
  }
}
```

For local development:

```json
{
  "da-ue-enabler": {
    "command": "node",
    "args": [
      "/absolute/path/to/mcp-da-ue-enabler/src/index.js"
    ]
  }
}
```

## GitHub Token Setup (Optional)

Required only if you want to analyze blocks from remote GitHub repositories or private repos.
Note - If the agent interactions starts from EDS project , the tools will consider code from local project
1. Go to: https://github.com/settings/tokens/new
2. Set token name (e.g., "AEM UE Enabler - Read Only")
3. Select scope:
   - Public repos: `public_repo`
   - Private repos: `repo`
4. Generate and copy the token
5. Add to your MCP config:

```json
{
  "da-ue-enabler": {
    "command": "npx",
    "args": [
      "https://github.com/kmurugulla/mcp-da-ue-enabler"
    ],
    "env": {
      "GITHUB_TOKEN": "ghp_your_token_here"
    }
  }
}
```

**Note:** The token is only used to read block code from repositories. No write access is required.

## Usage

Once installed, use natural language in Cursor to interact with the MCP server:

```
Initialize Universal Editor in my project at /path/to/project
```

```
List all blocks in my project
```

```
Analyze the accordion block structure
```

```
Generate UE configuration for the hero block
```

## License

MIT

## Repository

https://github.com/kmurugulla/mcp-da-ue-enabler
