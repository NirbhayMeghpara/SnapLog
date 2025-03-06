'use strict';

import { LOG_LEVELS } from './utils/constants.js';
import { createFileTransport } from './transports/fileTransport.js';

const createLogger = (options = {}) => {
  const state = {
    levels: options.levels || LOG_LEVELS,
    transport: createFileTransport(options.fileOptions || {}),
    processors: new Map(),
    filters: new Map(),
    patternCache: new Map()
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

  const computeLPSArray = (pattern) => {
    const lps = new Array(pattern.length).fill(0);
    let len = 0;
    let i = 1;
    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
    return lps;
  };

  const findPattern = (pattern, text) => {
    if (!pattern || !text) return false;
    const m = pattern.length;
    const n = text.length;
    if (m > n) return false;

    let lps = state.patternCache.get(pattern);
    if (!lps) {
      lps = computeLPSArray(pattern);
      state.patternCache.set(pattern, lps);
    }

    let i = 0, j = 0;
    while (i < n) {
      if (pattern[j] === text[i]) {
        i++;
        j++;
      }
      if (j === m) return true;
      else if (i < n && pattern[j] !== text[i]) {
        j = j !== 0 ? lps[j - 1] : 0;
        if (j === 0) i++;
      }
    }
    return false;
  };

  const addPatternFilter = (name, pattern, allow = true) => {
    state.filters.set(name, (info) => {
      const found = findPattern(pattern, info.message);
      return allow ? found : !found;
    });
    return logger;
  };

  const removeFilter = name => {
    state.filters.delete(name);
    return logger;
  };

  const findMultiplePatterns = (patterns, logs) => {
    // aho corasick algorithm
  };

  const processLog = (info, state) => {
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

  const logger = {
    ...levelFunctions,
    log,
    addProcessor,
    removeProcessor,
    addPatternFilter,
    removeFilter,
    findPattern,
    findMultiplePatterns
  };

  return logger;
};

export { createLogger };