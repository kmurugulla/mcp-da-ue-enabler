// src/constants/ue-field-types.js

/**
 * Universal Editor field type definitions and mappings
 */

export const UE_FIELD_TYPES = {
  TEXT: 'text',
  RICHTEXT: 'richtext',
  REFERENCE: 'reference',
  MULTISELECT: 'multiselect',
  SELECT: 'select',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  DATE: 'date',
};

export const VALUE_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
};

/**
 * Determine field type based on content patterns
 */
export function inferFieldType(content = '', context = {}) {
  if (!content) return UE_FIELD_TYPES.RICHTEXT;
  
  // Check for images
  if (content.includes('<picture') || content.includes('<img')) {
    return UE_FIELD_TYPES.REFERENCE;
  }
  
  // Check for rich content (paragraphs, headings, etc.)
  if (content.includes('<p>') || content.includes('<h1>') || content.includes('<h2>')) {
    return UE_FIELD_TYPES.RICHTEXT;
  }
  
  // Check for links
  if (content.includes('<a href')) {
    return UE_FIELD_TYPES.RICHTEXT;
  }
  
  // Check context hints
  if (context.isImage) {
    return UE_FIELD_TYPES.REFERENCE;
  }
  
  if (context.isMultiline || content.length > 100) {
    return UE_FIELD_TYPES.RICHTEXT;
  }
  
  // Default to text for simple content
  return UE_FIELD_TYPES.TEXT;
}

/**
 * Generate field label from CSS selector or context
 */
export function generateFieldLabel(selector, context = {}) {
  if (context.customLabel) {
    return context.customLabel;
  }
  
  // Extract meaningful label from selector
  // e.g., "div:nth-child(1)" → "Content 1"
  const childMatch = selector.match(/nth-child\((\d+)\)/);
  if (childMatch) {
    const index = parseInt(childMatch[1], 10);
    const commonLabels = ['Title', 'Content', 'Image', 'Description', 'Link'];
    return commonLabels[index - 1] || `Field ${index}`;
  }
  
  // Handle attribute selectors
  // e.g., "img[alt]" → "Alt Text"
  const attrMatch = selector.match(/\[([^\]]+)\]/);
  if (attrMatch) {
    const attr = attrMatch[1];
    return attr.charAt(0).toUpperCase() + attr.slice(1).replace('-', ' ');
  }
  
  return 'Content';
}

export default {
  UE_FIELD_TYPES,
  VALUE_TYPES,
  inferFieldType,
  generateFieldLabel,
};


