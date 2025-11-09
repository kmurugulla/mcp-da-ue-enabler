// src/lib/json-generator.js
import {
  inferFieldType,
  generateFieldLabel,
  UE_FIELD_TYPES,
  VALUE_TYPES,
} from '../constants/ue-field-types.js';
import { generateChildSelector } from '../constants/css-selectors.js';

/**
 * Generate block definitions
 */
export function generateBlockDefinitions(blockName, analysis) {
  const definitions = [];
  const { expectedStructure, isContainer } = analysis;
  
  // Main block definition
  const mainDef = {
    title: capitalizeBlockName(blockName),
    id: blockName,
    plugins: {
      da: {},
    },
  };
  
  // Determine if we should use unsafeHTML or rows/columns
  if (expectedStructure.type === 'table' && !isContainer) {
    mainDef.plugins.da.name = blockName;
    mainDef.plugins.da.rows = typeof expectedStructure.rows === 'number' 
      ? expectedStructure.rows 
      : 1;
    mainDef.plugins.da.columns = expectedStructure.columns;
  } else {
    // Use simple structure for now - can be customized later
    mainDef.plugins.da.name = blockName;
    mainDef.plugins.da.rows = 1;
    mainDef.plugins.da.columns = expectedStructure.columns;
  }
  
  definitions.push(mainDef);
  
  // If container block, create item definition
  if (isContainer) {
    const itemDef = {
      title: `${capitalizeBlockName(blockName)} Item`,
      id: `${blockName}-item`,
      plugins: {
        da: {
          name: `${blockName}-item`,
          rows: expectedStructure.rows === 'multiple' ? 2 : 1,
          columns: 0,
        },
      },
    };
    definitions.push(itemDef);
  }
  
  return definitions;
}

/**
 * Generate block models (fields)
 */
export function generateBlockModels(blockName, analysis, options = {}) {
  const models = [];
  const { expectedStructure, isContainer } = analysis;
  const { customFields = [] } = options;
  
  // Determine which model ID to use
  const modelId = isContainer ? `${blockName}-item` : blockName;
  
  const fields = [];
  
  // Generate fields based on column count
  for (let i = 0; i < expectedStructure.columns; i++) {
    const selector = generateChildSelector(i);
    const fieldLabel = customFields[i]?.label || generateFieldLabel(selector, { index: i });
    const fieldType = customFields[i]?.type || UE_FIELD_TYPES.RICHTEXT;
    
    const field = {
      component: fieldType,
      name: selector,
      value: '',
      label: fieldLabel,
      valueType: VALUE_TYPES.STRING,
    };
    
    // Add required flag for first field
    if (i === 0) {
      field.required = true;
    }
    
    fields.push(field);
  }
  
  models.push({
    id: modelId,
    fields,
  });
  
  return models;
}

/**
 * Generate block filters
 */
export function generateBlockFilters(blockName, analysis) {
  const filters = [];
  
  if (analysis.isContainer) {
    filters.push({
      id: blockName,
      components: [`${blockName}-item`],
    });
  }
  
  return filters;
}

/**
 * Generate complete block JSON configuration
 */
export function generateBlockJSON(blockName, analysis, options = {}) {
  return {
    definitions: generateBlockDefinitions(blockName, analysis),
    models: generateBlockModels(blockName, analysis, options),
    filters: generateBlockFilters(blockName, analysis),
  };
}

/**
 * Generate base page.json configuration
 */
export function generatePageConfig() {
  return {
    models: [
      {
        id: 'page-metadata',
        fields: [
          {
            component: 'text',
            name: 'title',
            label: 'Title',
          },
          {
            component: 'text',
            name: 'description',
            label: 'Description',
          },
          {
            component: 'reference',
            name: 'image',
            label: 'Image',
          },
          {
            component: 'text',
            name: 'robots',
            label: 'Robots',
            description: 'Index control via robots',
          },
        ],
      },
    ],
  };
}

/**
 * Generate text.json configuration
 */
export function generateTextConfig() {
  return {
    definitions: [
      {
        title: 'Text',
        id: 'text',
        plugins: {
          da: {
            name: 'text',
            type: 'text',
          },
        },
      },
    ],
    models: [],
  };
}

/**
 * Generate image.json configuration
 */
export function generateImageConfig() {
  return {
    definitions: [
      {
        title: 'Image',
        id: 'image',
        plugins: {
          da: {
            name: 'image',
            type: 'image',
          },
        },
      },
    ],
    models: [
      {
        id: 'image',
        fields: [
          {
            component: 'reference',
            name: 'image',
            hidden: true,
            multi: false,
          },
          {
            component: 'reference',
            name: 'img:nth-child(3)[src]',
            label: 'Image',
            multi: false,
          },
          {
            component: 'text',
            name: 'img:nth-child(3)[alt]',
            label: 'Alt Text',
          },
        ],
      },
    ],
  };
}

/**
 * Generate section.json configuration
 */
export function generateSectionConfig(blockNames = []) {
  return {
    definitions: [
      {
        title: 'Section',
        id: 'section',
        plugins: {
          da: {
            unsafeHTML: '<div></div>',
          },
        },
        filter: 'section',
        model: 'section',
      },
    ],
    models: [
      {
        id: 'section',
        fields: [
          {
            component: 'multiselect',
            name: 'style',
            label: 'Style',
            options: [
              {
                name: 'Highlight',
                value: 'highlight',
              },
            ],
          },
        ],
      },
    ],
    filters: [
      {
        id: 'section',
        components: ['text', 'image', ...blockNames],
      },
    ],
  };
}

/**
 * Generate component-definition.json template
 */
export function generateComponentDefinitionTemplate() {
  return {
    groups: [
      {
        title: 'Default Content',
        id: 'default',
        components: [
          {
            '...': './text.json#/definitions',
          },
          {
            '...': './image.json#/definitions',
          },
        ],
      },
      {
        title: 'Sections',
        id: 'sections',
        components: [
          {
            '...': './section.json#/definitions',
          },
        ],
      },
      {
        title: 'Blocks',
        id: 'blocks',
        components: [
          {
            '...': './blocks/*.json#/definitions',
          },
        ],
      },
    ],
  };
}

/**
 * Generate component-models.json template
 */
export function generateComponentModelsTemplate() {
  return [
    {
      '...': './page.json#/models',
    },
    {
      '...': './text.json#/models',
    },
    {
      '...': './image.json#/models',
    },
    {
      '...': './section.json#/models',
    },
    {
      '...': './blocks/*.json#/models',
    },
  ];
}

/**
 * Generate component-filters.json template
 */
export function generateComponentFiltersTemplate() {
  return [
    {
      id: 'main',
      components: ['section'],
    },
    {
      '...': './section.json#/filters',
    },
    {
      '...': './blocks/*.json#/filters',
    },
  ];
}

/**
 * Capitalize block name for display
 */
function capitalizeBlockName(name) {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default {
  generateBlockDefinitions,
  generateBlockModels,
  generateBlockFilters,
  generateBlockJSON,
  generatePageConfig,
  generateTextConfig,
  generateImageConfig,
  generateSectionConfig,
  generateComponentDefinitionTemplate,
  generateComponentModelsTemplate,
  generateComponentFiltersTemplate,
};

