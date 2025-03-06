# SnapLog

A high-performance logging library for Node.js applications optimized for speed, filtering, and real-time processing at scale.

## Overview

SnapLog is designed to handle large-scale, real-time log processing with advanced pattern-matching capabilities. It leverages optimized algorithms like Knuth-Morris-Pratt (KMP) for single-pattern matching to offer dramatically faster and more efficient log management compared to traditional tools.

## Purpose

This README guides you through testing SnapLog to evaluate its performance and filtering capabilities. You'll clone the repository, set up the environment, generate test data, and run benchmarks to compare SnapLog against Winston.

## Prerequisites

- **Node.js**: v16.x or higher (v18.x recommended)
- **npm**: For installing dependencies

## Project Structure

```
snaplog/
├── README.md
├── package.json
├── package-lock.json
├── benchmark.js
├── src/
│   ├── snaplog.js              # Core logger implementation with KMP filtering
│   ├── logGenerator.js         # Test log data generator
│   ├── transports/
│   │   └── fileTransport.js    # File output handling logic
│   └── utils/
│       └── constants.js        # Log level definitions and constants
└── test/
    ├── logs/                   # Directory for benchmark output files
    │   ├── snaplog-benchmark.log
    │   ├── snaplog-filtered.log
    │   ├── winston-benchmark.log
    │   └── winston-filtered.log
    └── testData/
        └── 10000_logs.json     # Sample log entries for benchmarking
```

## Quick Demo: How SnapLog Works

Here's a small, error-free example to demonstrate SnapLog's logging and KMP-based filtering:

```javascript
const { createLogger } = require('./src/snaplog');

// Create a logger writing to 'demo.log'
const logger = createLogger({
  fileOptions: {
    filename: 'demo.log',
    format: 'json',
    logDir: './test/logs'
  }
});

// Log messages with different levels
logger.log('info', 'Server started successfully');
logger.log('error', 'Connection failed');

// Add KMP filter to exclude logs with "failed"
logger.addPatternFilter('no-failures', 'failed', false);

// Test the filter
logger.log('info', 'Database connected');      // Written to demo.log
logger.log('error', 'Query failed');           // Filtered out
```

**What's Happening?**

1. `createLogger`: Initializes a logger that outputs JSON to test/logs/demo.log.
2. `logger.log`: Writes messages with specified levels (e.g., 'info', 'error').
3. `addPatternFilter`: Applies KMP to filter out logs containing "failed".
4. **Result**: demo.log contains only `{ "level": "info", "message": "Server started successfully" }` and `{ "level": "info", "message": "Database connected" }`.

This showcases SnapLog's ability to log efficiently and filter precisely using KMP.

## Step-by-Step Instructions to Test SnapLog

### Step 1: Clone the Repository

Start by downloading the SnapLog project from GitHub:

```bash
git clone https://github.com/NirbhayMeghpara/SnapLog.git
cd snaplog
```

- This creates a local copy of the project in a folder named `snaplog`.

### Step 2: Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

- This installs `winston` (for benchmarking), `chalk` (for colored output), and Node.js built-in modules like `fs` and `perf_hooks`.
- Ensure no errors appear; check Node.js version with `node -v` if issues arise.

### Step 3: Verify Project Structure

Check that your folder contains these key files:

- `src/snaplog.js`: Core logger with KMP filtering.
- `src/transports/fileTransport.js`: File output logic.
- `src/utils/constants.js`: Log levels.
- `benchmark.js`: Benchmark script comparing SnapLog and Winston.
- `package.json`: Project metadata and scripts.
- Optional: `src/logGenerator.js` and `test/testData/10000_logs.json` (if provided).

### Step 4: Generate Test Logs (Optional)

If `test/testData/10000_logs.json` isn't included, generate test data:

```bash
npm run generate-logs
```

- Requires `src/logGenerator.js` (if not present, see note below).
- Creates `test/testData/10000_logs.json` with 10,000 log entries (mix of levels, some with "failed").
- **Note**: If `logGenerator.js` isn't provided, you'll need a sample JSON file with entries like `{ "level": "info", "message": "Test log", "metadata": {} }`. Contact me or create one manually.

### Step 5: Prepare the Logs Directory

Ensure the output directory exists:

```bash
mkdir -p test/logs
```

- Creates `test/logs/` for benchmark output files (snaplog-benchmark.log, etc.).

### Step 6: Run the Benchmark

Execute the benchmark suite to test SnapLog's performance:

```bash
npm run benchmark
```

- Runs `node --expose-gc benchmark.js`, enabling garbage collection for accurate memory stats.
- Performs two tests:
  - **Raw Logging**: Logs all entries without filtering.
  - **Filtered Logging**: Filters out logs with "failed".
- Outputs results to the terminal and files in `test/logs/`.

### Step 7: Analyze the Results

**Terminal Output**: Look for:
- "Logging Benchmark": Time, ops/sec, logs written.
- "Filtering Benchmark": Same metrics with filtered logs.
- "Performance Comparison": SnapLog vs. Winston (SnapLog should be faster with KMP).

**Log Files**:
- `test/logs/snaplog-benchmark.log`: Raw logs.
- `test/logs/winston-benchmark.log`: Raw logs.
- `test/logs/snaplog-filtered.log`: Filtered logs.
- `test/logs/winston-filtered.log`: Filtered logs.
- Verify filtering: Check `*-filtered.log` files—no logs should contain "failed".

### Step 8: Test SnapLog Manually (Optional)

To explore SnapLog's API:

Create `test.js`:
```javascript
const { createLogger } = require('./src/snaplog');
const logger = createLogger({ 
  fileOptions: { 
    filename: 'test.log', 
    format: 'json', 
    logDir: './test/logs' 
  } 
});

logger.log('info', 'Test message');
logger.addPatternFilter('no-errors', 'error', false);
logger.log('error', 'This won\'t log');
logger.setFile({ filename: 'test2.log' });
logger.log('info', 'Switched file');
```

Run it:
```bash
node test.js
```

Check `test/logs/test.log` and `test/logs/test2.log`.

## Expected Outcome

- **Raw Logging**: SnapLog logs entries faster than Winston.
- **Filtered Logging**: SnapLog's KMP filtering outperforms Winston.
- **Files**: Separate raw and filtered logs, with filtering applied correctly.

## Troubleshooting

- "Cannot find module": Rerun `npm install`.
- No logs in `test/logs/`: Ensure `10000_logs.json` exists and is valid.
- Benchmark fails: Check Node.js version; run `node --expose-gc benchmark.js` manually.

## Why SnapLog?

SnapLog addresses inefficiencies in traditional loggers (e.g., Winston) for high-frequency environments, offering faster processing and precise filtering.

## Acknowledgments

This project was developed under the guidance of [Dr. Chris Whidden](https://www.dal.ca/faculty/computerscience/faculty-staff/chris-whidden.html) as the final project for the Algorithm Engineering (CSCI 6105) course in Winter 2025 at Dalhousie University, 

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/NirbhayMeghpara/SnapLog/blob/main/LICENSE) file for details.