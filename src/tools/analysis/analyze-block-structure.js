// src/tools/analysis/analyze-block-structure.js
import {
  listBlocksFromLocal,
  listBlocksFromGitHub,
  getBlockCode,
  analyzeBlockStructure,
  suggestInitialStructure,
} from '../../lib/block-analyzer.js';
import path from 'path';
import { directoryExists } from '../../lib/file-system.js';

export const analyzeBlockStructureTool = {
  name: 'ue_analysis_analyze_block_structure',
  description: 'Analyze a block\'s JavaScript structure to determine its expected content structure, DOM transformations, and UE requirements.',
  inputSchema: {
    type: 'object',
    properties: {
      blockName: {
        type: 'string',
        description: 'Name of the block to analyze',
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project root',
      },
      github: {
        type: 'object',
        description: 'GitHub parameters if fetching from repository',
        properties: {
          org: { type: 'string' },
          repo: { type: 'string' },
          branch: { type: 'string', default: 'main' },
          blocksPath: { type: 'string', default: 'blocks' },
        },
        required: ['org', 'repo'],
      },
      localBlocksPath: {
        type: 'string',
        description: 'Custom path to local blocks directory. Omit to use ./blocks',
      },
      useLocal: {
        type: 'boolean',
        description: 'Explicitly use local file system. Omit to auto-detect.',
      },
    },
    required: ['blockName', 'projectPath'],
  },
  
  handler: async (args) => {
    try {
      const { blockName, projectPath, github, localBlocksPath, useLocal } = args;
      
      // Find the block
      let blocks;
      let blockInfo;
      
      if (github && !useLocal) {
        blocks = await listBlocksFromGitHub(github);
        blockInfo = blocks.find(b => b.name === blockName);
        if (!blockInfo) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Block "${blockName}" not found in GitHub repository ${github.org}/${github.repo}`,
              },
            ],
            isError: true,
          };
        }
      } else {
        const blocksPath = localBlocksPath || path.join(projectPath, 'blocks');
        if (!(await directoryExists(blocksPath))) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Blocks directory not found at ${blocksPath}`,
              },
            ],
            isError: true,
          };
        }
        
        blocks = await listBlocksFromLocal(blocksPath);
        blockInfo = blocks.find(b => b.name === blockName);
        if (!blockInfo) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Block "${blockName}" not found in ${blocksPath}`,
              },
            ],
            isError: true,
          };
        }
      }
      
      // Check if block has JavaScript
      if (!blockInfo.hasJs) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Block "${blockName}" does not have a JavaScript file`,
            },
          ],
          isError: true,
        };
      }
      
      // Get block code
      const blockCode = await getBlockCode(blockInfo, { github });
      
      // Analyze structure
      const analysis = await analyzeBlockStructure(blockCode);
      
      // Get suggestions
      const suggestion = suggestInitialStructure(analysis);
      
      // Format response
      const result = {
        blockName,
        analysis: {
          expectedStructure: analysis.expectedStructure,
          domTransformations: analysis.domTransformations,
          isContainer: analysis.isContainer,
          requiresObserver: analysis.requiresObserver,
          complexity: analysis.complexity,
          hasAsync: analysis.hasAsync,
          hasVariants: analysis.hasVariants,
          usesReadBlockConfig: analysis.usesReadBlockConfig,
          configKeys: analysis.configKeys,
        },
        suggestion,
        codeSnippet: blockCode.substring(0, 500) + (blockCode.length > 500 ? '...' : ''),
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing block structure: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export default analyzeBlockStructureTool;


