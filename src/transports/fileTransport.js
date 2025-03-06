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

  // Pre-compile format function based on type
  const formatLog = format === 'json'
      ? (info) => JSON.stringify(info) + '\n'
      : (info) => `${info.timestamp || new Date().toISOString()} [${info.level}] ${info.message}${info.meta ? ' ' + JSON.stringify(info.meta) : ''}\n`;

  // Simple write function
  const write = (info) => {
      try {
          writeStream.write(formatLog(info));
      } catch (error) {
          console.error('Error writing log:', error);
      }
  };

  const setFile = (newOptions) => {
    writeStream.end();
    filename = newOptions.filename || filename;
    format = newOptions.format || format;
    logDir = newOptions.logDir || logDir;
    filePath = path.join(logDir, filename);
    writeStream = fs.createWriteStream(filePath, { flags: 'a' });
  };

  process.on('exit', () => writeStream.end());

  return { log: write, setFile };
};