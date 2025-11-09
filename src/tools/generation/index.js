// src/tools/generation/index.js
import { generateBlockJsonTool } from './generate-block-json.js';
import { generateBaseConfigsTool } from './generate-base-configs.js';

export const tools = {
  [generateBlockJsonTool.name]: generateBlockJsonTool,
  [generateBaseConfigsTool.name]: generateBaseConfigsTool,
};

export default tools;

