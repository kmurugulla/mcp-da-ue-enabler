// src/tools/analysis/index.js
import { listBlocks } from './list-blocks.js';
import { analyzeBlockStructureTool } from './analyze-block-structure.js';

export const tools = {
  [listBlocks.name]: listBlocks,
  [analyzeBlockStructureTool.name]: analyzeBlockStructureTool,
};

export default tools;


