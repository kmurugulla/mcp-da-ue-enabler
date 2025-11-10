// src/lib/validators.js
import { fileExists, directoryExists, readJSON } from './file-system.js';
import path from 'path';

/**
 * Validate UE setup completeness
 */
export async function validateUESetup(projectPath) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    checks: {},
  };
  
  try {
    // Check package.json exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    results.checks.packageJson = await fileExists(packageJsonPath);
    if (!results.checks.packageJson) {
      results.errors.push('package.json not found');
      results.valid = false;
    }
    
    // Check ue folder structure
    const uePath = path.join(projectPath, 'ue');
    results.checks.ueFolder = await directoryExists(uePath);
    if (!results.checks.ueFolder) {
      results.errors.push('ue/ directory not found');
      results.valid = false;
    }
    
    const ueModelsPath = path.join(uePath, 'models');
    results.checks.ueModelsFolder = await directoryExists(ueModelsPath);
    if (!results.checks.ueModelsFolder) {
      results.errors.push('ue/models/ directory not found');
      results.valid = false;
    }
    
    const ueBlocksPath = path.join(ueModelsPath, 'blocks');
    results.checks.ueBlocksFolder = await directoryExists(ueBlocksPath);
    if (!results.checks.ueBlocksFolder) {
      results.warnings.push('ue/models/blocks/ directory not found - no blocks instrumented yet');
    }
    
    const ueScriptsPath = path.join(uePath, 'scripts');
    results.checks.ueScriptsFolder = await directoryExists(ueScriptsPath);
    if (!results.checks.ueScriptsFolder) {
      results.errors.push('ue/scripts/ directory not found');
      results.valid = false;
    }
    
    // Check base config files
    const baseConfigs = ['page.json', 'text.json', 'image.json', 'section.json'];
    results.checks.baseConfigs = {};
    
    for (const config of baseConfigs) {
      const configPath = path.join(ueModelsPath, config);
      const exists = await fileExists(configPath);
      results.checks.baseConfigs[config] = exists;
      if (!exists) {
        results.errors.push(`Base config ${config} not found`);
        results.valid = false;
      }
    }
    
    // Check template files
    const templateConfigs = [
      'component-definition.json',
      'component-models.json',
      'component-filters.json',
    ];
    results.checks.templateConfigs = {};
    
    for (const config of templateConfigs) {
      const configPath = path.join(ueModelsPath, config);
      const exists = await fileExists(configPath);
      results.checks.templateConfigs[config] = exists;
      if (!exists) {
        results.errors.push(`Template config ${config} not found in ue/models/`);
        results.valid = false;
      }
    }
    
    // Check root-level consolidated files
    const rootConfigs = [
      'component-definition.json',
      'component-models.json',
      'component-filters.json',
    ];
    results.checks.rootConfigs = {};
    
    for (const config of rootConfigs) {
      const configPath = path.join(projectPath, config);
      const exists = await fileExists(configPath);
      results.checks.rootConfigs[config] = exists;
      if (!exists) {
        results.warnings.push(`Consolidated config ${config} not found in root - run build:json`);
      }
    }
    
    // Check UE scripts
    const ueJs = path.join(ueScriptsPath, 'ue.js');
    const ueUtilsJs = path.join(ueScriptsPath, 'ue-utils.js');
    
    results.checks.ueJs = await fileExists(ueJs);
    results.checks.ueUtilsJs = await fileExists(ueUtilsJs);
    
    if (!results.checks.ueJs) {
      results.errors.push('ue/scripts/ue.js not found');
      results.valid = false;
    }
    if (!results.checks.ueUtilsJs) {
      results.errors.push('ue/scripts/ue-utils.js not found');
      results.valid = false;
    }
    
    // Check package.json for required scripts and dependencies
    if (results.checks.packageJson) {
      const packageJson = await readJSON(packageJsonPath);
      
      // Check build scripts
      const requiredScripts = ['build:json', 'build:json:models', 'build:json:definitions', 'build:json:filters'];
      results.checks.buildScripts = {};
      
      for (const script of requiredScripts) {
        const exists = packageJson.scripts?.[script] !== undefined;
        results.checks.buildScripts[script] = exists;
        if (!exists) {
          results.warnings.push(`Build script "${script}" not found in package.json`);
        }
      }
      
      // Check dependencies
      const requiredDeps = ['merge-json-cli', 'npm-run-all', 'husky'];
      results.checks.dependencies = {};
      
      for (const dep of requiredDeps) {
        const exists = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
        results.checks.dependencies[dep] = !!exists;
        if (!exists) {
          results.errors.push(`Required dependency "${dep}" not found in package.json`);
          results.valid = false;
        }
      }
    }
    
    // Check git hooks
    const huskyPath = path.join(projectPath, '.husky');
    results.checks.huskyFolder = await directoryExists(huskyPath);
    
    if (!results.checks.huskyFolder) {
      results.warnings.push('.husky/ directory not found - git hooks not set up');
    } else {
      const preCommitPath = path.join(huskyPath, 'pre-commit');
      results.checks.preCommitHook = await fileExists(preCommitPath);
      if (!results.checks.preCommitHook) {
        results.warnings.push('Pre-commit hook not found - automatic build on commit not enabled');
      }
    }
    
  } catch (error) {
    results.valid = false;
    results.errors.push(`Validation error: ${error.message}`);
  }
  
  return results;
}

/**
 * Validate JSON configuration schema
 */
export function validateBlockJSON(json) {
  const errors = [];
  const warnings = [];
  
  // Check required top-level keys
  if (!json.definitions) {
    errors.push('Missing "definitions" array');
  }
  if (!json.models) {
    errors.push('Missing "models" array');
  }
  if (!json.filters) {
    errors.push('Missing "filters" array');
  }
  
  // Validate definitions
  if (json.definitions && Array.isArray(json.definitions)) {
    json.definitions.forEach((def, index) => {
      if (!def.title) {
        errors.push(`Definition ${index}: missing "title"`);
      }
      if (!def.id) {
        errors.push(`Definition ${index}: missing "id"`);
      }
      if (!def.plugins?.da) {
        errors.push(`Definition ${index}: missing "plugins.da"`);
      }
    });
  }
  
  // Validate models
  if (json.models && Array.isArray(json.models)) {
    json.models.forEach((model, index) => {
      if (!model.id) {
        errors.push(`Model ${index}: missing "id"`);
      }
      if (!model.fields || !Array.isArray(model.fields)) {
        errors.push(`Model ${index}: missing "fields" array`);
      } else {
        model.fields.forEach((field, fieldIndex) => {
          if (!field.component) {
            errors.push(`Model ${index}, Field ${fieldIndex}: missing "component"`);
          }
          if (!field.name) {
            errors.push(`Model ${index}, Field ${fieldIndex}: missing "name" (CSS selector)`);
          }
          if (!field.label) {
            warnings.push(`Model ${index}, Field ${fieldIndex}: missing "label" - recommended for UE UI`);
          }
        });
      }
    });
  }
  
  // Validate filters
  if (json.filters && Array.isArray(json.filters)) {
    json.filters.forEach((filter, index) => {
      if (!filter.id) {
        errors.push(`Filter ${index}: missing "id"`);
      }
      if (!filter.components || !Array.isArray(filter.components)) {
        errors.push(`Filter ${index}: missing "components" array`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if required dependencies are installed
 */
export async function checkDependencies(projectPath) {
  const results = {
    installed: true,
    missing: [],
  };
  
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!(await fileExists(packageJsonPath))) {
      results.installed = false;
      results.missing.push('package.json not found');
      return results;
    }
    
    const packageJson = await readJSON(packageJsonPath);
    const requiredDeps = ['merge-json-cli', 'npm-run-all', 'husky'];
    
    for (const dep of requiredDeps) {
      const installed = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
      if (!installed) {
        results.installed = false;
        results.missing.push(dep);
      }
    }
  } catch (error) {
    results.installed = false;
    results.missing.push(`Error checking dependencies: ${error.message}`);
  }
  
  return results;
}

export default {
  validateUESetup,
  validateBlockJSON,
  checkDependencies,
};


