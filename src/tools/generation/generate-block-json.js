// src/tools/generation/generate-block-json.js
import {
  listBlocksFromLocal,
  listBlocksFromGitHub,
  getBlockCode,
  analyzeBlockStructure,
} from '../../lib/block-analyzer.js';
import { generateBlockJSON } from '../../lib/json-generator.js';
import { validateBlockJSON } from '../../lib/validators.js';
import { writeJSON, directoryExists } from '../../lib/file-system.js';
import path from 'path';

export const generateBlockJsonTool = {
  name: 'ue_generation_generate_block_json',
  description: 'Generate Universal Editor JSON configuration for a block based on its code structure analysis.',
  inputSchema: {
    type: 'object',
    properties: {
      blockName: {
        type: 'string',
        description: 'Name of the block to generate configuration for',
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project root',
      },
      outputPath: {
        type: 'string',
        description: 'Optional custom output path. Defaults to ue/models/blocks/{blockName}.json',
      },
      preview: {
        type: 'boolean',
        description: 'If true, return JSON without writing to file',
        default: false,
      },
      customFields: {
        type: 'array',
        description: 'Optional array of custom field configurations to override defaults',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            type: { type: 'string' },
          },
        },
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
      const { blockName, projectPath, outputPath, preview = false, customFields, github, localBlocksPath, useLocal } = args;
      
      // Find the block
      let blocks;
      let blockInfo;
      
      if (github && !useLocal) {
        blocks = await listBlocksFromGitHub(github);
        blockInfo = blocks.find(b => b.name === blockName);
      } else {
        const blocksPath = localBlocksPath 
          ? path.join(projectPath, localBlocksPath) 
          : path.join(projectPath, 'blocks');
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
      }
      
      if (!blockInfo) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Block "${blockName}" not found`,
            },
          ],
          isError: true,
        };
      }
      
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
      
      // Get and analyze block code
      const blockCode = await getBlockCode(blockInfo, { github });
      const analysis = await analyzeBlockStructure(blockCode);
      
      // Generate JSON configuration
      const options = customFields ? { customFields } : {};
      const jsonConfig = generateBlockJSON(blockName, analysis, options);
      
      // Validate the generated JSON
      const validation = validateBlockJSON(jsonConfig);
      
      const result = {
        blockName,
        analysis: {
          complexity: analysis.complexity,
          isContainer: analysis.isContainer,
          requiresObserver: analysis.requiresObserver,
          domTransformations: analysis.domTransformations,
        },
        jsonConfig,
        validation,
      };
      
      // Preview mode: return JSON without writing
      if (preview) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      // Write to file
      const finalOutputPath = outputPath || path.join(projectPath, 'ue', 'models', 'blocks', `${blockName}.json`);
      await writeJSON(finalOutputPath, jsonConfig);
      
      result.filePath = finalOutputPath;
      result.message = `Successfully generated ${blockName}.json`;
      
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
            text: `Error generating block JSON: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export default generateBlockJsonTool;


