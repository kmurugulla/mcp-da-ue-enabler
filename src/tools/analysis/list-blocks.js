// src/tools/analysis/list-blocks.js
import { listBlocksFromLocal, listBlocksFromGitHub } from '../../lib/block-analyzer.js';
import path from 'path';
import { directoryExists } from '../../lib/file-system.js';

export const listBlocks = {
  name: 'ue_analysis_list_blocks',
  description: 'List all blocks in the project. Auto-detects local blocks if ./blocks exists, or can fetch from GitHub.',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the project root',
      },
      useLocal: {
        type: 'boolean',
        description: 'Explicitly use local file system. Omit to auto-detect.',
      },
      localBlocksPath: {
        type: 'string',
        description: 'Custom path to local blocks directory. Omit to use ./blocks',
      },
      github: {
        type: 'object',
        description: 'ONLY provide if explicitly fetching from a different GitHub repo. Omit to auto-detect local blocks.',
        properties: {
          org: { type: 'string' },
          repo: { type: 'string' },
          branch: { type: 'string', default: 'main' },
          blocksPath: { type: 'string', default: 'blocks' },
        },
        required: ['org', 'repo'],
      },
    },
    required: ['projectPath'],
  },
  
  handler: async (args) => {
    try {
      const { projectPath, useLocal, localBlocksPath, github } = args;
      
      let blocks;
      let source;
      
      // Auto-detect or use explicit source
      if (github) {
        blocks = await listBlocksFromGitHub(github);
        source = `GitHub: ${github.org}/${github.repo}`;
      } else {
        const blocksPath = localBlocksPath || path.join(projectPath, 'blocks');
        
        // Check if blocks directory exists
        if (!(await directoryExists(blocksPath))) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Blocks directory not found at ${blocksPath}\n\nPlease provide GitHub parameters to fetch from repository, or ensure the blocks directory exists locally.`,
              },
            ],
            isError: true,
          };
        }
        
        blocks = await listBlocksFromLocal(blocksPath);
        source = `Local: ${blocksPath}`;
      }
      
      // Format the response
      const summary = {
        source,
        blocksFound: blocks.length,
        blocks: blocks.map(b => ({
          name: b.name,
          hasJs: b.hasJs,
          hasCss: b.hasCss,
          path: b.path,
        })),
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing blocks: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export default listBlocks;


