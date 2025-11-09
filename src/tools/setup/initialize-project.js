// src/tools/setup/initialize-project.js
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  fileExists,
  directoryExists,
  createDirectory,
  readJSON,
  writeJSON,
  writeFile,
} from '../../lib/file-system.js';
import { generateBaseConfigsTool } from '../generation/generate-base-configs.js';
import path from 'path';

const execAsync = promisify(exec);

export const initializeProjectTool = {
  name: 'ue_setup_initialize_project',
  description: 'Initialize Universal Editor support in an AEM project. Creates folder structure, installs dependencies, sets up build scripts and git hooks.',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the project root',
      },
      skipDependencies: {
        type: 'boolean',
        description: 'Skip npm install step',
        default: false,
      },
      skipGitHooks: {
        type: 'boolean',
        description: 'Skip Husky git hooks setup',
        default: false,
      },
    },
    required: ['projectPath'],
  },
  
  handler: async (args) => {
    try {
      const { projectPath, skipDependencies = false, skipGitHooks = false } = args;
      
      const results = {
        steps: [],
        errors: [],
        success: false,
      };
      
      // Step 1: Validate project
      results.steps.push({ step: 'Validating project', status: 'running' });
      
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!(await fileExists(packageJsonPath))) {
        results.errors.push('package.json not found - not an npm project');
        results.steps[0].status = 'failed';
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2),
          }],
          isError: true,
        };
      }
      results.steps[0].status = 'completed';
      
      // Step 2: Create folder structure
      results.steps.push({ step: 'Creating folder structure', status: 'running' });
      
      const foldersToCreate = [
        'ue',
        'ue/models',
        'ue/models/blocks',
        'ue/scripts',
      ];
      
      for (const folder of foldersToCreate) {
        const folderPath = path.join(projectPath, folder);
        await createDirectory(folderPath);
      }
      results.steps[1].status = 'completed';
      results.steps[1].folders = foldersToCreate;
      
      // Step 3: Generate base configs
      results.steps.push({ step: 'Generating base configurations', status: 'running' });
      
      const baseConfigsResult = await generateBaseConfigsTool.handler({ projectPath });
      if (baseConfigsResult.isError) {
        results.errors.push('Failed to generate base configs');
        results.steps[2].status = 'failed';
      } else {
        results.steps[2].status = 'completed';
        results.steps[2].files = JSON.parse(baseConfigsResult.content[0].text).created;
      }
      
      // Step 4: Update package.json with build scripts
      results.steps.push({ step: 'Adding build scripts to package.json', status: 'running' });
      
      try {
        const packageJson = await readJSON(packageJsonPath);
        
        if (!packageJson.scripts) {
          packageJson.scripts = {};
        }
        
        // Add build scripts
        const newScripts = {
          'build:json': 'npm-run-all -p build:json:models build:json:definitions build:json:filters',
          'build:json:models': 'merge-json-cli -i "ue/models/component-models.json" -o "component-models.json"',
          'build:json:definitions': 'merge-json-cli -i "ue/models/component-definition.json" -o "component-definition.json"',
          'build:json:filters': 'merge-json-cli -i "ue/models/component-filters.json" -o "component-filters.json"',
        };
        
        Object.assign(packageJson.scripts, newScripts);
        
        // Add prepare script for Husky if not present
        if (!skipGitHooks && !packageJson.scripts.prepare) {
          packageJson.scripts.prepare = 'husky';
        }
        
        await writeJSON(packageJsonPath, packageJson);
        results.steps[3].status = 'completed';
        results.steps[3].scripts = Object.keys(newScripts);
      } catch (error) {
        results.errors.push(`Failed to update package.json: ${error.message}`);
        results.steps[3].status = 'failed';
      }
      
      // Step 5: Install dependencies
      if (!skipDependencies) {
        results.steps.push({ step: 'Installing dependencies', status: 'running' });
        
        try {
          const depsToInstall = ['merge-json-cli', 'npm-run-all', 'husky'];
          const { stdout, stderr } = await execAsync(
            `cd "${projectPath}" && npm install --save-dev ${depsToInstall.join(' ')}`,
            { maxBuffer: 10 * 1024 * 1024 }
          );
          
          results.steps[4].status = 'completed';
          results.steps[4].dependencies = depsToInstall;
        } catch (error) {
          results.errors.push(`Failed to install dependencies: ${error.message}`);
          results.steps[4].status = 'failed';
        }
      } else {
        results.steps.push({ step: 'Installing dependencies', status: 'skipped' });
      }
      
      // Step 6: Setup git hooks
      if (!skipGitHooks) {
        results.steps.push({ step: 'Setting up git hooks', status: 'running' });
        
        try {
          // Initialize Husky
          await execAsync(`cd "${projectPath}" && npx husky init`, { maxBuffer: 10 * 1024 * 1024 });
          
          // Create pre-commit hook
          const huskyPath = path.join(projectPath, '.husky');
          const preCommitPath = path.join(huskyPath, 'pre-commit');
          const preCommitMjsPath = path.join(huskyPath, 'pre-commit.mjs');
          
          // Read templates
          const fs = await import('fs/promises');
          const templatesDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'templates', 'hooks');
          
          const preCommitContent = await fs.readFile(path.join(templatesDir, 'pre-commit.template'), 'utf-8');
          const preCommitMjsContent = await fs.readFile(path.join(templatesDir, 'pre-commit.mjs.template'), 'utf-8');
          
          await writeFile(preCommitPath, preCommitContent);
          await writeFile(preCommitMjsPath, preCommitMjsContent);
          
          results.steps[5].status = 'completed';
          results.steps[5].hooks = ['pre-commit', 'pre-commit.mjs'];
        } catch (error) {
          results.errors.push(`Failed to setup git hooks: ${error.message}`);
          results.steps[5].status = 'failed';
        }
      } else {
        results.steps.push({ step: 'Setting up git hooks', status: 'skipped' });
      }
      
      // Final summary
      results.success = results.errors.length === 0;
      results.message = results.success
        ? '✅ Universal Editor successfully initialized!'
        : `⚠️  Initialization completed with ${results.errors.length} error(s)`;
      
      results.nextSteps = [
        '1. Run "npm run build:json" to generate consolidated config files',
        '2. Start instrumenting blocks with "ue_generation_generate_block_json"',
        '3. Validate setup with "ue_validation_validate_setup"',
      ];
      
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
            text: `Error initializing project: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export default initializeProjectTool;

