// src/tools/setup/index.js
import { initializeProjectTool } from './initialize-project.js';

export const tools = {
  [initializeProjectTool.name]: initializeProjectTool,
};

export default tools;

