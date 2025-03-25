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
  logs = JSON.parse(fs.readFileSync("./benchmark/testData/100_logs.json", "utf8"));
} catch (error) {
  console.error(chalk.red("Error loading test data:"), error);
  process.exit(1);
}

const logDir = path.join(__dirname, "benchmark", "logs");
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

let winstonStream = fs.createWriteStream(
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
    await Promise.all([
      fs.promises.writeFile(path.join(logDir, 'snaplog-benchmark.log'), '', { flag: 'w' }),
      fs.promises.writeFile(path.join(logDir, 'winston-benchmark.log'), '', { flag: 'w' }),
      fs.promises.writeFile(path.join(logDir, 'snaplog-kmp-filtered.log'), '', { flag: 'w' }),
      fs.promises.writeFile(path.join(logDir, 'snaplog-ac-filtered.log'), '', { flag: 'w' }),
      fs.promises.writeFile(path.join(logDir, 'winston-kmp-filtered.log'), '', { flag: 'w' }),
      fs.promises.writeFile(path.join(logDir, 'winston-ac-filtered.log'), '', { flag: 'w' })
    ]);
  } catch (error) {
    console.error(chalk.red('Error clearing log files:'), error);
  }
}

async function collectGarbage() {
  if (global.gc) {
    global.gc();
    // wait for GC to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function benchmarkLogging(logger, loggerName, fileName) {
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let spinnerIdx = 0;

  const baseMessage = `Running logging benchmark for ${chalk.blue(loggerName)}...`;
  const messageLength = baseMessage.length + chalk.cyan(' ').length;

  const spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(spinner[spinnerIdx])} ${baseMessage}`);
    spinnerIdx = (spinnerIdx + 1) % spinner.length;
  }, 80);

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
    console.error(chalk.red(`\nError during ${loggerName} logging benchmark:`), error);
    return null;
  }

  clearInterval(spinnerInterval);
  process.stdout.write('\r' + ' '.repeat(messageLength));

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
    operationsPerSecond: logs.length / ((endTime - startTime) / 1000)
  };
}

function formatResults(results, loggerName, type = "Logging") {
  if (!results) return chalk.red("Benchmark failed");

  const header = chalk.bold.blue(`${loggerName} ${type} Results`);
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

function compareResults(snapLogResults, winstonResults, type = "Logging") {
  if (!snapLogResults || !winstonResults) {
    console.log(chalk.red(`Cannot compare ${type.toLowerCase()} results - one or both benchmarks failed`));
    return;
  }

  const timePerformance = ((winstonResults.time - snapLogResults.time) / winstonResults.time) * 100;
  const opsPerformance = ((snapLogResults.operationsPerSecond - winstonResults.operationsPerSecond) / winstonResults.operationsPerSecond) * 100;
  const memoryPerformance = ((winstonResults.memory.heapUsed - snapLogResults.memory.heapUsed) / winstonResults.memory.heapUsed) * 100;
  const cpuPerformance = ((winstonResults.cpu.total - snapLogResults.cpu.total) / winstonResults.cpu.total) * 100;

  const formatComparison = (value, label, perfType = 'performance') => {
    const absValue = Math.abs(value).toFixed(2);
    const isPositive = value > 0;
    const arrow = isPositive ? "↑" : "↓";
    let message;
    switch (perfType) {
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
${chalk.bold.blue(`${type} Performance Comparison`)}
${chalk.gray("─".repeat(40))}
${formatComparison(timePerformance, "Time", 'time')}
${formatComparison(opsPerformance, "Operations", 'ops')}
${formatComparison(memoryPerformance, "Memory", 'resource')}
${formatComparison(cpuPerformance, "CPU", 'resource')}
`);
}

async function benchmarkFiltering(logger, loggerName, filterType, fileName) {
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let spinnerIdx = 0;
  const baseMessage = `Running ${filterType} filtering benchmark for ${chalk.blue(loggerName)}...`;
  const messageLength = baseMessage.length + chalk.cyan(' ').length;

  const spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(spinner[spinnerIdx])} ${baseMessage}`);
    spinnerIdx = (spinnerIdx + 1) % spinner.length;
  }, 80);

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
    console.error(chalk.red(`\nError during ${loggerName} ${filterType} filtering benchmark:`), error);
    return null;
  }

  clearInterval(spinnerInterval);
  process.stdout.write('\r' + ' '.repeat(messageLength));

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
    operationsPerSecond: logs.length / ((endTime - startTime) / 1000)
  };
}

async function runBenchmarks() {
  console.log(chalk.bold.blue("\n🚀 Starting Benchmark Suite"));
  console.log(chalk.gray("─".repeat(40)));
  console.log(chalk.yellow("Test data:"), chalk.cyan(`${logs.length.toLocaleString()} log entries`));

  try {
    await clearLogFiles();

    // Logging Benchmark (No Filtering)
    console.log(chalk.bold.yellow("\nLogging Benchmark (No Filtering)"));
    const snapLogLogging = await benchmarkLogging(snapLog, "SnapLog", "snaplog-benchmark.log");
    console.log(formatResults(snapLogLogging, "SnapLog", "Logging"));

    const winstonLogging = await benchmarkLogging(winstonLogger, "Winston", "winston-benchmark.log");
    console.log(formatResults(winstonLogging, "Winston", "Logging"));

    compareResults(snapLogLogging, winstonLogging, "Logging");

    // KMP Filtering Benchmark
    console.log(chalk.bold.yellow("\nKMP Filtering Benchmark"));
    snapLog.setFile({ filename: "snaplog-kmp-filtered.log" });
    snapLog.addPatternFilter('no-errors', 'error', false);

    const snapLogKMPFiltering = await benchmarkFiltering(snapLog, "SnapLog", "KMP", "snaplog-kmp-filtered.log");
    console.log(formatResults(snapLogKMPFiltering, "SnapLog", "KMP Filtering"));
    snapLog.removeFilter('no-errors');

    // Clear winston transports and create a new one with filtering    
    winstonLogger.clear();
    winstonStream = fs.createWriteStream(
      path.join(logDir, "winston-kmp-filtered.log"), { flags: 'w' }
    );
    winstonLogger.add(
      new winston.transports.Stream({
        stream: winstonStream,
        format: winston.format.combine(
          winston.format((info) => info.message.includes('error') ? false : info)(),
          winston.format.json()
        )
      })
    );
    const winstonKMPFiltering = await benchmarkFiltering(winstonLogger, "Winston", "KMP", "winston-kmp-filtered.log");
    console.log(formatResults(winstonKMPFiltering, "Winston", "KMP Filtering"));

    compareResults(snapLogKMPFiltering, winstonKMPFiltering, "KMP Filtering");

    // Aho-Corasick Filtering Benchmark
    console.log(chalk.bold.yellow("\nAho-Corasick Filtering Benchmark"));
    snapLog.setFile({ filename: "snaplog-ac-filtered.log" });
    snapLog.addMultiPatternFilter('multi-errors', ['timeout', 'error', 'failed'], true);
    const snapLogACFiltering = await benchmarkFiltering(snapLog, "SnapLog", "Aho-Corasick", "snaplog-ac-filtered.log");
    console.log(formatResults(snapLogACFiltering, "SnapLog", "Aho-Corasick Filtering"));
    snapLog.removeFilter('multi-errors');

    winstonLogger.clear();
    winstonStream = fs.createWriteStream(path.join(logDir, "winston-ac-filtered.log"), { flags: 'w' });
    winstonLogger.add(
      new winston.transports.Stream({
        stream: winstonStream,
        format: winston.format.combine(
          winston.format((info) => {
            const msg = info.message;
            return msg.includes('timeout') || msg.includes('error') || msg.includes('failed') ? info : false;
          })(),
          winston.format.json()
        )
      })
    );
    const winstonACFiltering = await benchmarkFiltering(winstonLogger, "Winston", "Aho-Corasick", "winston-ac-filtered.log");
    console.log(formatResults(winstonACFiltering, "Winston", "Aho-Corasick Filtering"));

    compareResults(snapLogACFiltering, winstonACFiltering, "Aho-Corasick Filtering");

    console.log(chalk.bold.blue("\n🏁 Benchmark Suite Complete"));
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
console.log(chalk.yellow("Garbage collection:"), global.gc ? chalk.green("enabled") : chalk.red("disabled"));

runBenchmarks().catch(error => console.error(chalk.red("\nUnhandled error:"), error));