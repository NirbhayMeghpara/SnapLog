'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createFileTransport = (options = {}) => {
  const { filename = 'app.log', format = 'json', logDir = path.join(__dirname, '../logs') } = options;

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const filePath = path.join(logDir, filename);

  // Function to write logs based on the specified format
  const write = (info) => {
    let logEntry;
    
    if (format === 'json') {
      logEntry = JSON.stringify(info) + '\n';
    } else {
      // Human readable format
      logEntry = `${info.timestamp || new Date().toISOString()} [${info.level}] ${info.message} ${info.meta ? JSON.stringify(info.meta) : ''}\n`;
    }

    try {
      fs.appendFileSync(filePath, logEntry);
    } catch (error) {
      console.error('Error writing log to file:', error);
    }
  };

  return {
    log: write
  };
};