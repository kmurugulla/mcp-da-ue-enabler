// src/lib/block-analyzer.js
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import path from 'path';
import { getFileContent, getDirectoryContents } from './github-client.js';
import { readFile, listDirectory, fileExists } from './file-system.js';
import {
  DOM_TRANSFORMATIONS,
  CONTAINER_PATTERNS,
  CHILDREN_ACCESS_PATTERNS,
  assessBlockComplexity,
} from '../constants/block-patterns.js';

/**
 * List blocks from local file system
 */
export async function listBlocksFromLocal(blocksPath) {
  const blocks = [];
  
  try {
    const entries = await listDirectory(blocksPath);
    
    for (const entry of entries) {
      if (entry.isDirectory) {
        const blockName = entry.name;
        const blockPath = entry.path;
        
        const jsPath = path.join(blockPath, `${blockName}.js`);
        const cssPath = path.join(blockPath, `${blockName}.css`);
        
        const hasJs = await fileExists(jsPath);
        const hasCss = await fileExists(cssPath);
        
        blocks.push({
          name: blockName,
          path: blockPath,
          hasJs,
          hasCss,
          source: 'local',
        });
      }
    }
  } catch (error) {
    throw new Error(`Failed to read blocks directory: ${error.message}`);
  }
  
  return blocks;
}

/**
 * List blocks from GitHub repository
 */
export async function listBlocksFromGitHub({ org, repo, branch = 'main', blocksPath = 'blocks' }) {
  const blocks = [];
  
  try {
    const contents = await getDirectoryContents({ org, repo, path: blocksPath, branch });
    
    for (const item of contents) {
      if (item.type === 'dir') {
        const blockName = item.name;
        
        // Check for .js and .css files
        const blockContents = await getDirectoryContents({
          org,
          repo,
          path: `${blocksPath}/${blockName}`,
          branch,
        });
        
        const hasJs = blockContents.some(f => f.name === `${blockName}.js`);
        const hasCss = blockContents.some(f => f.name === `${blockName}.css`);
        
        blocks.push({
          name: blockName,
          path: `${blocksPath}/${blockName}`,
          hasJs,
          hasCss,
          githubUrl: item.html_url,
          source: 'github',
        });
      }
    }
  } catch (error) {
    throw new Error(`Failed to fetch blocks from GitHub: ${error.message}`);
  }
  
  return blocks;
}

/**
 * Get block code (JavaScript)
 */
export async function getBlockCode(blockInfo, options = {}) {
  const { name, path: blockPath, source } = blockInfo;
  const jsFileName = `${name}.js`;
  
  try {
    if (source === 'github') {
      const { org, repo, branch = 'main' } = options.github || {};
      if (!org || !repo) {
        throw new Error('GitHub org and repo required for GitHub source');
      }
      return await getFileContent({
        org,
        repo,
        path: `${blockPath}/${jsFileName}`,
        branch,
      });
    } else {
      const jsPath = path.join(blockPath, jsFileName);
      return await readFile(jsPath);
    }
  } catch (error) {
    throw new Error(`Failed to get block code for ${name}: ${error.message}`);
  }
}

/**
 * Extract config keys from blocks using readBlockConfig
 */
export function extractConfigKeys(blockCode) {
  const configKeys = new Set();
  const patterns = [
    /config\['([^']+)'\]/g,
    /config\["([^"]+)"\]/g,
    /config\.([a-zA-Z][a-zA-Z0-9_-]*)/g,
    /blockConfig\['([^']+)'\]/g,
    /blockConfig\["([^"]+)"\]/g,
    /blockConfig\.([a-zA-Z][a-zA-Z0-9_-]*)/g,
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(blockCode)) !== null) {
      const key = match[1];
      if (key && !key.includes('(') && !key.includes(')') && !key.includes('readBlockConfig')) {
        configKeys.add(key);
      }
    }
  });
  const processBlockConfigPattern = /toClassName\(cols\[0\]\.textContent\)/g;
  if (processBlockConfigPattern.test(blockCode)) {
    const namePatterns = [
      /name === '([^']+)'/g,
      /name === "([^"]+)"/g,
      /name\.trim\(\) === '([^']+)'/g,
      /name !== '([^']+)'/g,
      /name !== "([^"]+)"/g,
    ];
    namePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(blockCode)) !== null) {
        configKeys.add(match[1]);
      }
    });
  }
  return Array.from(configKeys).sort();
}
/**
 * Analyze block structure from JavaScript code
 */
export async function analyzeBlockStructure(blockCode) {
  const analysis = {
    expectedStructure: {
      type: 'unknown',
      rows: 1,
      columns: 1,
    },
    domTransformations: [],
    isContainer: false,
    requiresObserver: false,
    childrenAccessPatterns: [],
    complexity: 'SIMPLE',
    hasAsync: false,
    hasVariants: false,
    usesReadBlockConfig: false,
    configKeys: [],
  };
  
  try {
    // Parse the JavaScript code
    const ast = acorn.parse(blockCode, {
      ecmaVersion: 2022,
      sourceType: 'module',
    });
    
    // Detect readBlockConfig usage
    const readBlockConfigPattern = /readBlockConfig\s*\(/;
    if (readBlockConfigPattern.test(blockCode)) {
      analysis.usesReadBlockConfig = true;
      analysis.expectedStructure.type = 'config-table';
      analysis.configKeys = extractConfigKeys(blockCode);
      analysis.expectedStructure.rows = 'multiple';
      analysis.expectedStructure.columns = 2;
    }
    
    // Detect children access patterns
    const childIndices = new Set();
    const blockChildrenPattern = /\.children\[(\d+)\]/g;
    let match;
    while ((match = blockChildrenPattern.exec(blockCode)) !== null) {
      childIndices.add(parseInt(match[1], 10));
      analysis.childrenAccessPatterns.push({
        type: 'index-access',
        index: parseInt(match[1], 10),
      });
    }
    
    if (childIndices.size > 0 && !analysis.usesReadBlockConfig) {
      analysis.expectedStructure.columns = Math.max(...childIndices) + 1;
    }
    
    // Detect spread operator on children
    if (blockCode.includes('[...block.children]') && !analysis.usesReadBlockConfig) {
      analysis.expectedStructure.type = 'table';
      analysis.childrenAccessPatterns.push({ type: 'spread' });
      
      // If forEach is present, likely multiple rows
      if (blockCode.includes('.forEach')) {
        analysis.expectedStructure.rows = 'multiple';
        analysis.isContainer = true;
      }
    }
    
    // Detect DOM transformations
    for (const { pattern, transform, requiresObserver } of DOM_TRANSFORMATIONS) {
      if (pattern.test(blockCode)) {
        analysis.domTransformations.push(transform);
        if (requiresObserver) {
          analysis.requiresObserver = true;
        }
      }
    }
    
    // Detect container patterns
    for (const { pattern, isContainer } of CONTAINER_PATTERNS) {
      if (pattern.test(blockCode)) {
        analysis.isContainer = isContainer;
      }
    }
    
    // Detect async operations
    if (blockCode.includes('async') || blockCode.includes('await')) {
      analysis.hasAsync = true;
    }
    
    // Detect variants (class manipulation)
    if (blockCode.includes('classList') || blockCode.match(/className\s*=/)) {
      analysis.hasVariants = true;
    }
    
    // Assess complexity
    analysis.complexity = assessBlockComplexity(analysis);
    
  } catch (error) {
    throw new Error(`Failed to analyze block structure: ${error.message}`);
  }
  
  return analysis;
}

/**
 * Detect DOM mutations that would break UE instrumentation
 */
export function detectDomMutations(blockCode) {
  const mutations = [];
  
  for (const { pattern, transform } of DOM_TRANSFORMATIONS) {
    if (pattern.test(blockCode)) {
      mutations.push({
        transform,
        pattern: pattern.source,
        needsObserver: true,
      });
    }
  }
  
  // Detect replaceWith operations
  if (blockCode.includes('.replaceWith(')) {
    mutations.push({
      transform: 'element-replacement',
      pattern: 'replaceWith',
      needsObserver: true,
    });
  }
  
  // Detect innerHTML replacements
  if (blockCode.includes('.innerHTML')) {
    mutations.push({
      transform: 'innerHTML-replacement',
      pattern: 'innerHTML',
      needsObserver: false,
      warning: 'innerHTML replacements may lose UE attributes',
    });
  }
  
  return mutations;
}

/**
 * Suggest initial structure for block definition
 */
export function suggestInitialStructure(analysis) {
  const suggestion = {
    useUnsafeHTML: false,
    rows: 1,
    columns: 1,
  };
  
  // If complex transformations, suggest unsafeHTML
  if (analysis.domTransformations.length > 1 || analysis.complexity === 'COMPLEX') {
    suggestion.useUnsafeHTML = true;
    suggestion.reason = 'Complex DOM structure detected, recommend using unsafeHTML';
  } else {
    // Use rows/columns for simple structures
    if (typeof analysis.expectedStructure.rows === 'number') {
      suggestion.rows = analysis.expectedStructure.rows;
    }
    suggestion.columns = analysis.expectedStructure.columns;
  }
  
  return suggestion;
}

export default {
  listBlocksFromLocal,
  listBlocksFromGitHub,
  getBlockCode,
  analyzeBlockStructure,
  detectDomMutations,
  suggestInitialStructure,
};


