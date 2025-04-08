'use strict';

import { LOG_LEVELS } from './utils/constants.js';
import { createFileTransport } from './transports/fileTransport.js';
import { findPattern } from './algorithms/kmp.js';
import { createTrie, addPatternToTrie, buildFailureLinks, findMultiplePatterns } from './algorithms/ahoCorasick.js';

/**
 * Creates a logger instance with customizable filtering and file output.
 * @param {Object} [options={}] - Configuration options for the logger.
 * @param {Object} [options.levels] - Custom log levels (defaults to LOG_LEVELS).
 * @param {Object} [options.fileOptions] - File transport options.
 * @param {string} [options.fileOptions.filename] - Output file name (e.g., 'app.log').
 * @param {string} [options.fileOptions.format] - Log format ('json' or 'text').
 * @param {string} [options.fileOptions.logDir] - Directory for log files.
 * @returns {Object} Logger instance with logging and filtering methods.
 */
const createLogger = (options = {}) => {
  const state = {
    levels: options.levels || LOG_LEVELS,
    transport: createFileTransport(options.fileOptions || {}),
    processors: new Map(),
    filters: new Map(),
    patternCache: new Map(),
    acTrie: createTrie() // Initialize Aho-Corasick trie
  };

  /**
   * Logs a message with the specified level and optional metadata.
   * @param {string} level - Log level (e.g., 'info', 'error').
   * @param {string} message - Log message.
   * @param {Object} [meta={}] - Optional metadata.
   * @returns {boolean} True if logged successfully, false otherwise.
   */
  const log = (level, message, meta = {}) => {
    const info = meta && Object.keys(meta).length > 0 ? { message, ...meta, level: level.toLowerCase() } : { message, level: level.toLowerCase() };
    return processLog(info, state);
  };

  // Dynamically create level-specific methods (e.g., logger.info, logger.error)
  const levelFunctions = Object.keys(state.levels).reduce((acc, level) => ({
    ...acc,
    [level.toLowerCase()]: (...args) => log(level, ...args)
  }), {});

  /**
   * Adds a processor function to transform log entries.
   * @param {string} name - Unique processor name.
   * @param {Function} processorFn - Function to process log info.
   * @returns {Object} Logger instance for chaining.
   */
  const addProcessor = (name, processorFn) => {
    state.processors.set(name, processorFn);
    return logger;
  };

  /**
   * Removes a processor by name.
   * @param {string} name - Processor name to remove.
   * @returns {Object} Logger instance for chaining.
   */
  const removeProcessor = name => {
    state.processors.delete(name);
    return logger;
  };

  /**
   * Adds a KMP-based filter for single-pattern matching.
   * @param {string} name - Unique filter name.
   * @param {string} pattern - Pattern to match.
   * @param {boolean} [allow=true] - True to allow matches, false to exclude.
   * @returns {Object} Logger instance for chaining.
   */
  const addPatternFilter = (name, pattern, allow = true) => {
    state.filters.set(name, (info) => {
      const found = findPattern(pattern, info.message, state.patternCache);
      return allow ? found : !found;
    });
    return logger;
  };

  /**
   * Adds an Aho-Corasick-based filter for multi-pattern matching.
   * @param {string} name - Unique filter name.
   * @param {string[]} patterns - Array of patterns to match.
   * @param {boolean} [allow=true] - True to allow matches, false to exclude.
   * @returns {Object} Logger instance for chaining.
   */
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

  /**
   * Removes a filter by name.
   * @param {string} name - Filter name to remove.
   * @returns {Object} Logger instance for chaining.
   */
  const removeFilter = name => {
    state.filters.delete(name);
    return logger;
  };

  /**
   * Processes and logs the info object, applying processors and filters.
   * @param {Object} info - Log info object.
   * @param {Object} state - Logger state.
   * @returns {boolean} True if logged, false if filtered or invalid.
   * @private
   */
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

  /**
   * Updates the output file configuration.
   * @param {Object} [newOptions={}] - New file options.
   * @param {string} [newOptions.filename] - New file name.
   * @param {string} [newOptions.format] - New format ('json' or 'text').
   * @param {string} [newOptions.logDir] - New log directory.
   */
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