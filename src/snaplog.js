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
    const info = normalizeInput(message, meta);
    info.level = level;
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

  const normalizeInput = (message, meta = {}) => {
    if (typeof message === 'object') {
      return { ...message };
    }
    return {
      message,
      ...meta
    };
  };

  const processLog = (info, state) => {
    const processedInfo = Array.from(state.processors.values())
      .reduce((acc, processor) => processor(acc), info);

    const shouldLog = Array.from(state.filters.values())
      .every(filter => filter(processedInfo));

    if (!shouldLog) return false;

    state.transport.log(processedInfo);
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