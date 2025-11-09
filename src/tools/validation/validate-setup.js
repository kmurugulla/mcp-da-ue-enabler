// src/tools/validation/validate-setup.js
import { validateUESetup } from '../../lib/validators.js';

export const validateSetupTool = {
  name: 'ue_validation_validate_setup',
  description: 'Validate the entire Universal Editor setup in a project, checking for required files, folders, dependencies, and configurations.',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the project root',
      },
    },
    required: ['projectPath'],
  },
  
  handler: async (args) => {
    try {
      const { projectPath } = args;
      
      const results = await validateUESetup(projectPath);
      
      // Format a summary message
      const summary = {
        valid: results.valid,
        totalErrors: results.errors.length,
        totalWarnings: results.warnings.length,
        errors: results.errors,
        warnings: results.warnings,
        checks: results.checks,
      };
      
      if (results.valid) {
        summary.message = '✅ Universal Editor setup is complete and valid!';
      } else {
        summary.message = `❌ Universal Editor setup has ${results.errors.length} error(s) and ${results.warnings.length} warning(s).`;
      }
      
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
            text: `Error validating setup: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export default validateSetupTool;

