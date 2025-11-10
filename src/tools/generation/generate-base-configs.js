// src/tools/generation/generate-base-configs.js
import {
  generatePageConfig,
  generateTextConfig,
  generateImageConfig,
  generateSectionConfig,
  generateComponentDefinitionTemplate,
  generateComponentModelsTemplate,
  generateComponentFiltersTemplate,
} from '../../lib/json-generator.js';
import { writeJSON, writeFile, directoryExists, createDirectory } from '../../lib/file-system.js';
import path from 'path';

export const generateBaseConfigsTool = {
  name: 'ue_generation_generate_base_configs',
  description: 'Generate all base Universal Editor configuration files (page, text, image, section, and templates).',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the project root',
      },
      blockNames: {
        type: 'array',
        description: 'Optional array of block names to include in section filters',
        items: { type: 'string' },
        default: [],
      },
    },
    required: ['projectPath'],
  },
  
  handler: async (args) => {
    try {
      const { projectPath, blockNames = [] } = args;
      
      const ueModelsPath = path.join(projectPath, 'ue', 'models');
      const ueScriptsPath = path.join(projectPath, 'ue', 'scripts');
      
      // Ensure directories exist
      await createDirectory(ueModelsPath);
      await createDirectory(path.join(ueModelsPath, 'blocks'));
      await createDirectory(ueScriptsPath);
      
      const results = {
        created: [],
        errors: [],
      };
      
      // Generate and write base configs
      const configs = [
        { name: 'page.json', data: generatePageConfig() },
        { name: 'text.json', data: generateTextConfig() },
        { name: 'image.json', data: generateImageConfig() },
        { name: 'section.json', data: generateSectionConfig(blockNames) },
      ];
      
      for (const config of configs) {
        try {
          const configPath = path.join(ueModelsPath, config.name);
          await writeJSON(configPath, config.data);
          results.created.push(configPath);
        } catch (error) {
          results.errors.push({ file: config.name, error: error.message });
        }
      }
      
      // Generate template files
      const templates = [
        { name: 'component-definition.json', data: generateComponentDefinitionTemplate() },
        { name: 'component-models.json', data: generateComponentModelsTemplate() },
        { name: 'component-filters.json', data: generateComponentFiltersTemplate() },
      ];
      
      for (const template of templates) {
        try {
          const templatePath = path.join(ueModelsPath, template.name);
          await writeJSON(templatePath, template.data);
          results.created.push(templatePath);
        } catch (error) {
          results.errors.push({ file: template.name, error: error.message });
        }
      }
      
      // Copy UE script templates
      const scriptTemplates = [
        { source: 'ue.js.template', dest: 'ue.js' },
        { source: 'ue-utils.js.template', dest: 'ue-utils.js' },
      ];
      
      const templatesDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'templates', 'scripts');
      
      for (const script of scriptTemplates) {
        try {
          const fs = await import('fs/promises');
          const templatePath = path.join(templatesDir, script.source);
          const content = await fs.readFile(templatePath, 'utf-8');
          const destPath = path.join(ueScriptsPath, script.dest);
          await writeFile(destPath, content);
          results.created.push(destPath);
        } catch (error) {
          results.errors.push({ file: script.dest, error: error.message });
        }
      }
      
      results.success = results.errors.length === 0;
      results.message = results.success
        ? `Successfully created ${results.created.length} configuration files`
        : `Created ${results.created.length} files with ${results.errors.length} errors`;
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating base configs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export default generateBaseConfigsTool;


