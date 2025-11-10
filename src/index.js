#!/usr/bin/env node

// src/index.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool handlers
import * as setupTools from './tools/setup/index.js';
import * as analysisTools from './tools/analysis/index.js';
import * as generationTools from './tools/generation/index.js';
import * as validationTools from './tools/validation/index.js';

// Server setup
const server = new Server(
  {
    name: 'aem-ue-enabler',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool registry
const tools = {
  ...setupTools.tools,
  ...analysisTools.tools,
  ...generationTools.tools,
  ...validationTools.tools,
};

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.values(tools).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  })),
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = tools[name];

  if (!tool) {
    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${name}`,
        },
      ],
      isError: true,
    };
  }

  try {
    return await tool.handler(args);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log server start (to stderr so it doesn't interfere with MCP protocol)
  console.error('AEM UE Enabler MCP Server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


