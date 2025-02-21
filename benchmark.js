import { createLogger } from "./src/snaplog.js";
import winston from "winston";
import { performance } from "perf_hooks";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let logs;
try {
  logs = JSON.parse(fs.readFileSync("./test/testData/10000_logs.json", "utf8"));
} catch (error) {
  console.error(chalk.red("Error loading test data:"), error);
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

// Create write stream for Winston
const winstonStream = fs.createWriteStream(
  path.join(logDir, "winston-benchmark.log"),
  { flags: 'w' }
);

const winstonLogger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  transports: [new winston.transports.Stream({ stream: winstonStream })]
});

async function clearLogFiles() {
  try {
    await fs.promises.writeFile(path.join(logDir, 'snaplog-benchmark.log'), '', { flag: 'w' });
    await fs.promises.writeFile(path.join(logDir, 'winston-benchmark.log'), '', { flag: 'w' });
  } catch (error) {
    console.error(chalk.red('Error clearing log files:'), error);
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
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let spinnerIdx = 0;
  const spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(spinner[spinnerIdx])} Running benchmark for ${chalk.blue(loggerName)}...`);
    spinnerIdx = (spinnerIdx + 1) % spinner.length;
  }, 80);

  // Clear log files
  await clearLogFiles();

  // Force garbage collection
  await collectGarbage();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const startMemory = process.memoryUsage();
  const startCPU = process.cpuUsage();
  const startTime = performance.now();

  try {
    for (const log of logs) {
      const normalizedLevel = loggerName === "Winston" ? log.level.toLowerCase() : log.level;
      logger.log(normalizedLevel, log.message, log.metadata);
    }
  } catch (error) {
    clearInterval(spinnerInterval);
    console.error(chalk.red(`\nError during ${loggerName} benchmark:`), error);
    return null;
  }

  clearInterval(spinnerInterval);
  process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear spinner line

  const endTime = performance.now();
  const endMemory = process.memoryUsage();
  const endCPU = process.cpuUsage(startCPU);

  return {
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
}

function formatResults(results, loggerName) {
  if (!results) return chalk.red("Benchmark failed");

  const header = chalk.bold.blue(`${loggerName} Performance Results`);
  const separator = chalk.gray("─".repeat(40));

  return `
${header}
${separator}
${chalk.yellow("Time taken")}: ${chalk.cyan(results.time.toFixed(2))} ms
${chalk.yellow("Operations/second")}: ${chalk.cyan(Math.round(results.operationsPerSecond).toLocaleString())} ops/sec

${chalk.bold("Memory Usage")}:
${chalk.yellow("Heap")}: ${chalk.cyan(results.memory.heapUsed.toFixed(2))} MB

${chalk.bold("CPU Usage")}:
${chalk.yellow("User")}: ${chalk.cyan(results.cpu.user.toFixed(2))} ms
${chalk.yellow("System")}: ${chalk.cyan(results.cpu.system.toFixed(2))} ms
${chalk.yellow("Total")}: ${chalk.cyan(results.cpu.total.toFixed(2))} ms
`;
}

function compareResults(snapLogResults, winstonResults) {
  if (!snapLogResults || !winstonResults) {
    console.log(chalk.red("Cannot compare results - one or both benchmarks failed"));
    return;
  }

  const timePerformance = ((winstonResults.time - snapLogResults.time) / winstonResults.time) * 100;
  const opsPerformance = ((snapLogResults.operationsPerSecond - winstonResults.operationsPerSecond) / winstonResults.operationsPerSecond) * 100;
  const memoryPerformance = ((winstonResults.memory.heapUsed - snapLogResults.memory.heapUsed) / winstonResults.memory.heapUsed) * 100;
  const cpuPerformance = ((winstonResults.cpu.total - snapLogResults.cpu.total) / winstonResults.cpu.total) * 100;

  const formatComparison = (value, label, type = 'performance') => {
    const absValue = Math.abs(value).toFixed(2);
    const isPositive = value > 0;
    const arrow = isPositive ? "↑" : "↓";
    let message;
    
    switch (type) {
      case 'time':
        message = `${chalk.yellow(label)}: SnapLog is ${isPositive ? chalk.green(`${absValue}% ${arrow} faster`) : chalk.red(`${absValue}% ${arrow} slower`)}`;
        break;
      case 'ops':
        message = `${chalk.yellow(label)}: SnapLog performs ${isPositive ? chalk.green(`${absValue}% ${arrow} more`) : chalk.red(`${absValue}% ${arrow} fewer`)} operations per second`;
        break;
      case 'resource':
        message = `${chalk.yellow(label)}: SnapLog uses ${isPositive ? chalk.green(`${absValue}% less`) : chalk.red(`${absValue}% ${arrow} more`)}`;
        break;
    }
    
    return message;
  };

  console.log(`
${chalk.bold.blue("Performance Comparison")}
${chalk.gray("─".repeat(40))}
${formatComparison(timePerformance, "Time", 'time')}
${formatComparison(opsPerformance, "Operations", 'ops')}
${formatComparison(memoryPerformance, "Memory", 'resource')}
${formatComparison(cpuPerformance, "CPU", 'resource')}
`);
}

async function runBenchmarks() {
  console.log(chalk.bold.blue("\n🚀 Starting Benchmark Suite"));
  console.log(chalk.gray("─".repeat(40)));
  console.log(chalk.yellow("Test data:"), chalk.cyan(`${logs.length.toLocaleString()} log entries`));

  try {
    await clearLogFiles();

    const snapLogResults = await benchmark(snapLog, "SnapLog");
    console.log(formatResults(snapLogResults, "SnapLog"));

    const winstonResults = await benchmark(winstonLogger, "Winston");
    console.log(formatResults(winstonResults, "Winston"));

    compareResults(snapLogResults, winstonResults);
  } catch (error) {
    console.error(chalk.red("\nBenchmark suite failed:"), error);
  }
}

// System Information Header
console.log(chalk.bold.blue("\n📊 System Information"));
console.log(chalk.gray("─".repeat(40)));
console.log(chalk.yellow("Node.js version:"), chalk.cyan(process.version));
console.log(chalk.yellow("Platform:"), chalk.cyan(process.platform));
console.log(chalk.yellow("Architecture:"), chalk.cyan(process.arch));
console.log(chalk.yellow("Garbage collection:"), process.gc ? chalk.green("enabled") : chalk.red("disabled"));

runBenchmarks().catch(error => console.error(chalk.red("\nUnhandled error:"), error));