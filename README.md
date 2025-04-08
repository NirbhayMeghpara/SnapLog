# SnapLog

A high-performance logging library for Node.js with advanced pattern-matching filters.

## Motivation

SnapLog is built for speed and precision in logging, targeting applications that demand real-time, high-volume log processing. It uses optimized **Knuth-Morris-Pratt (KMP)** for single-pattern filtering and **Aho-Corasick** for multi-pattern filtering, offering a lightweight alternative to traditional loggers like Winston. With a focus on performance and flexibility, SnapLog supports file-based logging with customizable filters and processors, making it extensible for diverse use cases.

## Quick Start

Install SnapLog and start logging with a simple setup:

```bash
npm install snaplog
```

```javascript
import { createLogger } from 'snaplog';

const logger = createLogger({
  fileOptions: {
    filename: 'app.log',
    format: 'json',
    logDir: './logs'
  }
});

logger.info('App started');
```

See more examples in `./perf/` for performance demos or contribute your own!

## Usage

Create a logger instance with `createLogger` to leverage SnapLog’s features:

```javascript
import { createLogger } from 'snaplog';

const logger = createLogger({
  fileOptions: {
    filename: 'app.log',
    format: 'text',
    logDir: './logs'
  }
});

// Basic logging
logger.info('Server running');
logger.error('Connection issue');

// Single-pattern filter with KMP
logger.addPatternFilter('no-errors', 'error', false);
logger.info('Database online');     // Logged
logger.error('Query error');        // Filtered

// Multi-pattern filter with Aho-Corasick
logger.addMultiPatternFilter('errors-only', ['timeout', 'failed'], true);
logger.info('Task completed');      // Filtered
logger.error('Request timeout');    // Logged

// Add a processor
logger.addProcessor('timestamp', (info) => {
  info.timestamp = new Date().toISOString();
});

// Switch file
logger.setFile({ filename: 'errors.log' });
logger.error('Task failed');        // Logged to errors.log
```

## Features

- **High Performance**: Buffered file output for minimal overhead.
- **KMP Filtering**: Fast single-pattern matching with cached LPS arrays.
- **Aho-Corasick Filtering**: Efficient multi-pattern matching in one pass.
- **Customizable Output**: JSON or text format, configurable file locations.
- **Processors**: Transform logs before writing with custom functions.
- **Chainable API**: Fluent method calls for easy setup.

## API

Create a logger with `createLogger`:

```javascript
const logger = createLogger({
  fileOptions: { filename: 'logs.log', format: 'json', logDir: './logs' }
});
```

| Method                              | Description                                | Parameters |
|-------------------------------------|--------------------------------------------|------------|
| `logger.log(level, message, [meta])` | Logs a message with optional metadata.     | `level`: string, `message`: string, `meta`: object (optional) |
| `logger.<level>(message, [meta])`   | Shorthand for levels (e.g., info, error).  | `message`: string, `meta`: object (optional) |
| `logger.addPatternFilter(name, pattern, allow)` | Adds a KMP filter. | `name`: string, `pattern`: string, `allow`: boolean (default: true) |
| `logger.addMultiPatternFilter(name, patterns, allow)` | Adds an Aho-Corasick filter. | `name`: string, `patterns`: string[], `allow`: boolean (default: true) |
| `logger.removeFilter(name)`        | Removes a filter by name.                  | `name`: string |
| `logger.setFile(options)`          | Updates the output file configuration.     | `options`: { filename?, format?, logDir? } |
| `logger.addProcessor(name, fn)`    | Adds a processor to transform logs.        | `name`: string, `fn`: (info) => void |
| `logger.removeProcessor(name)`     | Removes a processor by name.               | `name`: string |

## Configuration Options for `createLogger`:

| Option               | Default     | Description                                |
|----------------------|-------------|--------------------------------------------|
| `fileOptions.filename` | `'app.log'` | Name of the output log file.              |
| `fileOptions.format`   | `'json'`    | Log format ('json' or 'text').            |
| `fileOptions.logDir`   | `'./logs'`  | Directory for log files (created if missing). |

## Logging Levels

SnapLog uses a simple level system (customizable via `constants.js`):

```javascript
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};
```

Level-specific methods (e.g., `logger.info`, `logger.error`) are auto-generated.

## Prerequisites

- **Node.js**: v16+ (v18+ recommended)
- **npm**: For installation

## Development Setup

Clone the repo:

```bash
git clone https://github.com/NirbhayMeghpara/SnapLog.git
cd snaplog
```

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm run test
```

Explore performance demos:

```bash
npm run perf:generate  # Generate test logs
npm run perf:benchmark # Run benchmarks
```

## Contributing

SnapLog is open-source and welcomes contributions! Whether you’ve spotted a bug, have a feature idea, or want to make improvements, we’d love to hear from you.

Here’s how you can contribute:

1. **Report an Issue**  
   Found a bug or have a feature suggestion? [Create a new issue](https://github.com/NirbhayMeghpara/SnapLog/issues) with a clear description. Feel free to label it appropriately (`bug`, `enhancement`, etc.).

2. **Discuss a Feature**  
   If you have an idea and would like to collaborate or need clarification, don’t hesitate to [connect with me](mailto:nirbhaymeghpara123@gmail.com) directly or open a discussion/issue. I’m happy to brainstorm and build great features together.

3. **Contribute Code**  
   - Fork the repository  
   - Create your feature branch:  
     ```bash
     git checkout -b feature/your-feature-name
     ```  
   - Commit your changes:  
     ```bash
     git commit -m "Add: your message"
     ```  
   - Push to the branch:  
     ```bash
     git push origin feature/your-feature-name
     ```  
   - Submit a pull request on GitHub

4. **Guidelines**
   - Include relevant unit tests for any new features or fixes.
   - Follow the existing coding style and structure.
   - Keep pull requests focused and well-documented.
   - Update documentation if your changes affect usage or behavior.

---

Looking forward to your contributions! 🚀

## Why SnapLog?

SnapLog prioritizes performance with optimized algorithms, offering faster filtering and logging than traditional tools, perfect for real-time, high-throughput applications.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/NirbhayMeghpara/SnapLog/blob/main/LICENSE) file for details.