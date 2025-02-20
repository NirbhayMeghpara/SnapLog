'use strict';

import { LOG_LEVELS } from './utils/constants.js';
import { createFileTransport } from './transports/fileTransport.js';

const createLogger = (options = {}) => {
  const state = {
    levels: options.levels || LOG_LEVELS,
    transport: createFileTransport(options.fileOptions || {}),
    processors: new Map(),
    filters: new Map()
  };

  const log = (level, message, meta = {}) => {
    const info = typeof message === 'object' 
      ? message 
      : { message, ...meta, level };

    return processLog(info, state);
  };

  const levelFunctions = Object.keys(state.levels).reduce((acc, level) => ({
    ...acc,
    [level]: (...args) => log(level, ...args)
  }), {});

  const addProcessor = (name, processorFn) => {
    state.processors.set(name, processorFn);
    return logger;
  };

  const removeProcessor = name => {
    state.processors.delete(name);
    return logger;
  };

  const findPattern = (pattern, logs) => {
    // kmp algorithm
  };

  const findMultiplePatterns = (patterns, logs) => {
    // aho corasick algorithm
  };

  const processLog = (info, state) => {
    for (const processor of state.processors) {
      processor(info);
    }

    for (const filter of state.filters) {
      if (!filter(info)) return false;
    }

    const sortedInfo = {};
    Object.keys(info).sort().forEach(key => {
      sortedInfo[key] = info[key];
    });

    state.transport.log(sortedInfo);
    return true;
  };

  const logger = {
    ...levelFunctions,
    log,
    addProcessor,
    removeProcessor,
    findPattern,
    findMultiplePatterns
  };

  return logger;
};

export { createLogger };