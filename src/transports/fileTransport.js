'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a file transport for logging with buffering and configurable output.
 * @param {Object} [options={}] - Configuration options for the file transport.
 * @param {string} [options.filename='app.log'] - Name of the log file.
 * @param {string} [options.format='json'] - Log format ('json' or 'text').
 * @param {string} [options.logDir] - Directory for log files (defaults to '../logs' from module location).
 * @returns {Object} Transport object with methods for logging and file management.
 */
export const createFileTransport = (options = {}) => {
  let { filename = 'app.log', format = 'json', logDir = path.join(__dirname, '../logs') } = options;

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  let filePath = path.join(logDir, filename);
  let writeStream = fs.createWriteStream(filePath, { flags: 'a' });
  let buffer = ''; // Buffer for batching log entries

  /**
   * Formats a log entry based on the specified format.
   * @param {Object} info - Log info object.
   * @returns {string} Formatted log string.
   * @private
   */
  const formatLog = format === 'json'
    ? (info) => JSON.stringify(info) + '\n'
    : (info) => `${info.timestamp || new Date().toISOString()} [${info.level}] ${info.message}${Object.keys(info.meta || {}).length ? ' ' + JSON.stringify(info.meta) : ''}\n`;

  /**
   * Writes a log entry to the buffer, flushing when full.
   * @param {Object} info - Log info object to write.
   */
  const write = (info) => {
    try {
      buffer += formatLog(info);
      if (buffer.length >= 16384) { // Match default highWaterMark (16KB)
        writeStream.write(buffer);
        buffer = '';
      }
    } catch (error) {
      console.error('Error writing log:', error);
    }
  };

  /**
   * Flushes any buffered log entries to the file.
   */
  const flush = () => {
    if (buffer.length > 0) {
      try {
        writeStream.write(buffer);
        buffer = '';
      } catch (error) {
        console.error('Error flushing log buffer:', error);
      }
    }
  };

  /**
   * Updates the file output configuration and switches the write stream.
   * @param {Object} newOptions - New file options.
   * @param {string} [newOptions.filename] - New file name.
   * @param {string} [newOptions.format] - New format ('json' or 'text').
   * @param {string} [newOptions.logDir] - New log directory.
   */
  const setFile = (newOptions) => {
    flush(); // Write any buffered logs before switching
    writeStream.end();
    filename = newOptions.filename || filename;
    format = newOptions.format || format;
    logDir = newOptions.logDir || logDir;
    filePath = path.join(logDir, filename);
    writeStream = fs.createWriteStream(filePath, { flags: 'a' });
  };

  process.on('exit', () => {
    flush(); // Ensure buffer is written on exit
    writeStream.end();
  });

  return { log: write, setFile, flush };
};