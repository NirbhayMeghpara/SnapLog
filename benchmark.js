import { createLogger } from './src/snaplog.js';
import winston from 'winston';
import { performance } from 'perf_hooks';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logs = JSON.parse(fs.readFileSync('./test/testData/small_logs.json', 'utf8'));

const snapLog = createLogger({
  fileOptions: { 
    filename: 'snaplog-test.log', 
    format: 'json',
    logDir: path.join(__dirname, 'test', 'logs')
  }
});

const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, 'test', 'logs', 'winston-test.log') 
    })
  ]
});

function benchmark(logger, loggerName) {
  console.log(`Benchmarking ${loggerName}...`);
  
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  logs.forEach(log => {
    const normalizedLevel = loggerName === 'Winston' ? log.level.toLowerCase() : log.level;
    logger.log(normalizedLevel, log.message, log.metadata);
  });

  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  const timeTaken = endTime - startTime;
  const memoryUsed = endMemory - startMemory;

  console.log(`${loggerName} - Time taken: ${timeTaken.toFixed(2)} ms`);
  console.log(`${loggerName} - Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);
  
  const cpuUsage = os.loadavg()[0];
  console.log(`${loggerName} - CPU Usage: ${cpuUsage.toFixed(2)}`);
}

// Run benchmarks
benchmark(snapLog, 'SnapLog');
benchmark(winstonLogger, 'Winston');