// src/constants/block-patterns.js

/**
 * Common block patterns and detection rules
 */

export const DOM_TRANSFORMATIONS = [
  {
    pattern: /createElement\(['"]details['"]\)/,
    transform: 'div->details',
    requiresObserver: true,
  },
  {
    pattern: /createElement\(['"]ul['"]\)/,
    transform: 'div->ul',
    requiresObserver: true,
  },
  {
    pattern: /createElement\(['"]li['"]\)/,
    transform: 'div->li',
    requiresObserver: true,
  },
  {
    pattern: /createElement\(['"]blockquote['"]\)/,
    transform: 'div->blockquote',
    requiresObserver: false,
  },
  {
    pattern: /createElement\(['"]summary['"]\)/,
    transform: 'div->summary',
    requiresObserver: true,
  },
  {
    pattern: /createElement\(['"]picture['"]\)/,
    transform: 'img->picture',
    requiresObserver: true,
  },
];

export const CONTAINER_PATTERNS = [
  {
    pattern: /\.forEach\(\(.*\)\s*=>/,
    isContainer: true,
    confidence: 'high',
  },
  {
    pattern: /data-aue-model/,
    isContainer: true,
    confidence: 'medium',
  },
  {
    pattern: /\.children\[\d+\]/,
    isContainer: false,
    confidence: 'low',
  },
];

export const CHILDREN_ACCESS_PATTERNS = [
  {
    // Matches: row.children[0], block.children[1], etc.
    pattern: /\.children\[(\d+)\]/g,
    extractIndex: (match) => parseInt(match.match(/\d+/)[0], 10),
  },
  {
    // Matches: [...block.children]
    pattern: /\[\.\.\.(\w+)\.children\]/g,
    isSpread: true,
  },
  {
    // Matches: block.children.length
    pattern: /\.children\.length/g,
    checkLength: true,
  },
];

export const BLOCK_COMPLEXITY = {
  SIMPLE: {
    score: 1,
    characteristics: [
      'No DOM transformations',
      'Direct children access',
      'No container behavior',
    ],
  },
  MODERATE: {
    score: 2,
    characteristics: [
      'Minor DOM transformations',
      'Some iteration',
      'May have variants',
    ],
  },
  COMPLEX: {
    score: 3,
    characteristics: [
      'Multiple DOM transformations',
      'Container block',
      'Dynamic content',
      'Requires observers',
    ],
  },
};

/**
 * Determine block complexity based on code analysis
 */
export function assessBlockComplexity(analysis) {
  let score = 0;
  
  if (analysis.domTransformations?.length > 0) score += 1;
  if (analysis.isContainer) score += 1;
  if (analysis.requiresObserver) score += 1;
  if (analysis.hasVariants) score += 0.5;
  if (analysis.asyncOperations) score += 0.5;
  
  if (score <= 1) return 'SIMPLE';
  if (score <= 2) return 'MODERATE';
  return 'COMPLEX';
}

export default {
  DOM_TRANSFORMATIONS,
  CONTAINER_PATTERNS,
  CHILDREN_ACCESS_PATTERNS,
  BLOCK_COMPLEXITY,
  assessBlockComplexity,
};


