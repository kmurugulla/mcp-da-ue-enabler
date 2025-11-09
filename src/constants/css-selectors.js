// src/constants/css-selectors.js

/**
 * CSS selector generation and utilities
 */

/**
 * Generate CSS selector for a child element
 */
export function generateChildSelector(index, tagName = 'div') {
  return `${tagName}:nth-child(${index + 1})`;
}

/**
 * Generate selector for image source
 */
export function generateImageSelector(index) {
  return `img:nth-child(${index + 1})[src]`;
}

/**
 * Generate selector for image alt text
 */
export function generateImageAltSelector(index) {
  return `img:nth-child(${index + 1})[alt]`;
}

/**
 * Generate selector for link href
 */
export function generateLinkSelector(index) {
  return `a:nth-child(${index + 1})[href]`;
}

/**
 * Validate CSS selector format
 */
export function isValidSelector(selector) {
  try {
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Parse selector to determine element type
 */
export function parseSelector(selector) {
  const info = {
    tagName: null,
    index: null,
    attribute: null,
    isImage: false,
    isLink: false,
  };
  
  // Extract tag name
  const tagMatch = selector.match(/^(\w+)/);
  if (tagMatch) {
    info.tagName = tagMatch[1];
  }
  
  // Extract nth-child index
  const indexMatch = selector.match(/nth-child\((\d+)\)/);
  if (indexMatch) {
    info.index = parseInt(indexMatch[1], 10) - 1;
  }
  
  // Extract attribute
  const attrMatch = selector.match(/\[([^\]]+)\]/);
  if (attrMatch) {
    info.attribute = attrMatch[1];
  }
  
  // Check for image
  info.isImage = selector.includes('img') || selector.includes('picture');
  
  // Check for link
  info.isLink = selector.includes('a[href]');
  
  return info;
}

export default {
  generateChildSelector,
  generateImageSelector,
  generateImageAltSelector,
  generateLinkSelector,
  isValidSelector,
  parseSelector,
};

