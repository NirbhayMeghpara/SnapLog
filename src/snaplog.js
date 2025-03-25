'use strict';

import { LOG_LEVELS } from './utils/constants.js';
import { createFileTransport } from './transports/fileTransport.js';
import { findPattern } from './algorithms/kmp.js';
import { createTrie, addPatternToTrie, buildFailureLinks, findMultiplePatterns } from './algorithms/ahoCorasick.js';

const createLogger = (options = {}) => {
  const state = {
    levels: options.levels || LOG_LEVELS,
    transport: createFileTransport(options.fileOptions || {}),
    processors: new Map(),
    filters: new Map(),
    patternCache: new Map(),
    acTrie: createTrie() // Initialize aho corasick trie
  };

  const log = (level, message, meta = {}) => {
    const info = meta && Object.keys(meta).length > 0 ? { message, ...meta, level: level.toLowerCase() } : { message, level: level.toLowerCase() };
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

  const addMultiPatternFilter = (name, patterns, allow = true) => {
    let updatedTrie = state.acTrie;
    patterns.forEach(pattern => {
      updatedTrie = addPatternToTrie(updatedTrie, pattern);
    });
    state.acTrie = buildFailureLinks(updatedTrie);
    state.filters.set(name, (info) => {
      const found = findMultiplePatterns(patterns, info.message, state.acTrie);
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

    if (state.processors.size > 0) {
      for (const processor of state.processors.values()) {
        processor(info);
      }
    }

    if (state.filters.size > 0 && info.message && typeof info.message === 'string') {
      for (const filter of state.filters.values()) {
        if (!filter(info)) return false;
      }
    }

    const sortedInfo = Object.keys(info).sort().reduce((acc, key) => {
      acc[key] = info[key];
      return acc;
    }, {});

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
    addMultiPatternFilter,
    removeFilter,
    setFile,
    findPattern: (pattern, text) => findPattern(pattern, text, state.patternCache),
    findMultiplePatterns: (patterns, text) => findMultiplePatterns(patterns, text, state.acTrie)
  };

  return logger;
};

export { createLogger };