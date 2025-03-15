'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createFileTransport = (options = {}) => {
  let { filename = 'app.log', format = 'json', logDir = path.join(__dirname, '../logs') } = options;

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  let filePath = path.join(logDir, filename);
  let writeStream = fs.createWriteStream(filePath, { flags: 'a' });
  let buffer = ''; // Buffer for batching log entries

  const formatLog = format === 'json'
      ? (info) => JSON.stringify(info) + '\n'
      : (info) => `${info.timestamp || new Date().toISOString()} [${info.level}] ${info.message}${Object.keys(info.meta || {}).length ? ' ' + JSON.stringify(info.meta) : ''}\n`;

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

  // Flush buffered logs
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