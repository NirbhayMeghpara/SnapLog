import { createLogger } from "./src/snaplog.js";
import winston from "winston";
import { performance } from "perf_hooks";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let logs;
try {
  logs = JSON.parse(fs.readFileSync("./test/testData/10000_logs.json", "utf8"));
} catch (error) {
  console.error("Error loading test data:", error);
  process.exit(1);
}

const logDir = path.join(__dirname, "test", "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const snapLog = createLogger({
  fileOptions: {
    filename: "snaplog-benchmark.log",
    format: "json",
    logDir: logDir,
  },
});

const winstonLogger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "winston-benchmark.log"),
    }),
  ],
});

async function clearLogFiles() {
  try {
    await fs.promises.writeFile(path.join(logDir, 'snaplog-benchmark.log'), '', { flag: 'w' });
    await fs.promises.writeFile(path.join(logDir, 'winston-benchmark.log'), '', { flag: 'w' });
  } catch (error) {
    console.error('Error clearing log files:', error);
  }
}

async function collectGarbage() {
  if (global.gc) {
    global.gc();
    // Wait for GC to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function benchmark(logger, loggerName) {
  console.log(`\nPreparing benchmark for ${loggerName}...`);

  // Clear log files
  await clearLogFiles();

  // Force garbage collection
  await collectGarbage();

  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`Running benchmark for ${loggerName}...`);

  const startMemory = process.memoryUsage();
  const startCPU = process.cpuUsage();
  const startTime = performance.now();

  try {
    for (const log of logs) {
      const normalizedLevel = loggerName === "Winston" ? log.level.toLowerCase() : log.level;
      logger.log(normalizedLevel, log.message, log.metadata);
    }
  } catch (error) {
    console.error(`Error during ${loggerName} benchmark:`, error);
    return null;
  }

  const endTime = performance.now();
  const endMemory = process.memoryUsage();
  const endCPU = process.cpuUsage(startCPU);

  const results = {
    time: endTime - startTime,
    memory: {
      heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / (1024 * 1024),
    },
    cpu: {
      user: endCPU.user / 1000,
      system: endCPU.system / 1000,
      total: (endCPU.user + endCPU.system) / 1000,
    },
    operationsPerSecond: logs.length / ((endTime - startTime) / 1000),
  };

  return results;
}

function formatResults(results) {
  if (!results) return "Benchmark failed";

  return `
Performance Results:
-------------------
Time taken: ${results.time.toFixed(2)} ms
Operations/second: ${Math.round(results.operationsPerSecond).toLocaleString()} ops/sec

Memory Usage:
- Heap: ${results.memory.heapUsed.toFixed(2)} MB

CPU Usage:
- User: ${results.cpu.user.toFixed(2)} ms
- System: ${results.cpu.system.toFixed(2)} ms
- Total: ${results.cpu.total.toFixed(2)} ms
`;
}

function compareResults(snapLogResults, winstonResults) {
  if (!snapLogResults || !winstonResults) {
    console.log("Cannot compare results - one or both benchmarks failed");
    return;
  }

  const timePerformance = ((winstonResults.time - snapLogResults.time) / winstonResults.time) * 100;
  const opsPerformance = ((snapLogResults.operationsPerSecond - winstonResults.operationsPerSecond) / winstonResults.operationsPerSecond) * 100;
  const memoryPerformance = ((winstonResults.memory.heapUsed - snapLogResults.memory.heapUsed) / winstonResults.memory.heapUsed) * 100;
  const cpuPerformance = ((winstonResults.cpu.total - snapLogResults.cpu.total) / winstonResults.cpu.total) * 100;

  console.log(`
Performance Comparison:
----------------------
Time: SnapLog is ${Math.abs(timePerformance).toFixed(2)}% ${timePerformance > 0 ? "faster" : "slower"}
Operations/sec: SnapLog is ${Math.abs(opsPerformance).toFixed(2)}% ${opsPerformance > 0 ? "faster" : "slower"}
Memory: SnapLog uses ${Math.abs(memoryPerformance).toFixed(2)}% ${memoryPerformance > 0 ? "less" : "more"} memory
CPU: SnapLog uses ${Math.abs(cpuPerformance).toFixed(2)}% ${cpuPerformance > 0 ? "less" : "more"} CPU
`);
}

async function runBenchmarks() {
  console.log("Starting benchmark suite...");
  console.log(`Test data: ${logs.length} log entries`);

  try {
    const winstonResults = await benchmark(winstonLogger, "Winston");
    console.log("Winston Results:", formatResults(winstonResults));

    const snapLogResults = await benchmark(snapLog, "SnapLog");
    console.log("SnapLog Results:", formatResults(snapLogResults));

    compareResults(snapLogResults, winstonResults);
  } catch (error) {
    console.error("Benchmark suite failed:", error);
  }
}

console.log("Node.js version:", process.version);
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);
console.log("Garbage collection enabled:", !!global.gc);

runBenchmarks().catch(console.error);