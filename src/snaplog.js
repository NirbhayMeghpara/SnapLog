'use strict';

import { LOG_LEVELS } from './utils/constants.js';
import { createFileTransport } from './transports/fileTransport.js';
import { findPattern } from './algorithms/kmp.js';
import { findMultiplePatterns } from './algorithms/ahoCorasick.js';

const createLogger = (options = {}) => {
  const state = {
    levels: options.levels || LOG_LEVELS,
    transport: createFileTransport(options.fileOptions || {}),
    processors: new Map(),
    filters: new Map(),
    patternCache: new Map()
  };

  const log = (level, message, meta = {}) => {
    const info = { message, ...meta, level: level.toLowerCase() };
    return processLog(info, state);
  };

  const levelFunctions = Object.keys(state.levels).reduce((acc, level) => ({
    ...acc,
    [level.toLowerCase()]: (...args) => log(level, ...args)
  }), {});

  const addProcessor = (name, processorFn) => {
    state.processors.set(name, processorFn);
    return logger;
  };

  const removeProcessor = name => {
    state.processors.delete(name);
    return logger;
  };

  const addPatternFilter = (name, pattern, allow = true) => {
    state.filters.set(name, (info) => {
      const found = findPattern(pattern, info.message, state.patternCache);
      return allow ? found : !found;
    });
    return logger;
  };

  const removeFilter = name => {
    state.filters.delete(name);
    return logger;
  };

  const processLog = (info, state) => {
    if (!info || typeof info !== 'object') return false;

    for (const processor of state.processors.values()) {
      processor(info);
    }

    for (const filter of state.filters.values()) {
      if (!filter(info)) return false;
    }

    const sortedInfo = {};
    Object.keys(info).sort().forEach(key => {
      sortedInfo[key] = info[key];
    });

    state.transport.log(sortedInfo);
    return true;
  };

  const setFile = (newOptions = {}) => {
    const updatedOptions = {
      filename: newOptions.filename || options.fileOptions.filename,
      format: newOptions.format || options.fileOptions.format,
      logDir: newOptions.logDir || options.fileOptions.logDir
    };
    state.transport.setFile(updatedOptions);
  };

  const logger = {
    ...levelFunctions,
    log,
    addProcessor,
    removeProcessor,
    addPatternFilter,
    removeFilter,
    setFile,
    findPattern: (pattern, text) => findPattern(pattern, text, state.patternCache),
    findMultiplePatterns
  };

  return logger;
};

export { createLogger };