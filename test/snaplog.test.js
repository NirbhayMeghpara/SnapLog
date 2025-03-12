import { createLogger } from '../src/snaplog.js';
import { createFileTransport } from '../src/transports/fileTransport.js';

// Mock fs to avoid real file operations
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    write: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock fileTransport.js
const mockTransport = {
  log: jest.fn(),
  setFile: jest.fn(),
};
jest.mock('../src/transports/fileTransport.js', () => ({
  createFileTransport: jest.fn(() => mockTransport),
}));

describe('SnapLog Unit Tests', () => {
  let logger;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = createLogger({
      fileOptions: {
        filename: 'test.log',
        format: 'json',
        logDir: './test/logs',
      },
    });
  });

  // 1. Logger Creation
  test('createLogger initializes with default configuration', () => {
    expect(logger).toBeDefined();
    expect(logger.log).toBeInstanceOf(Function);
    expect(logger.info).toBeInstanceOf(Function); // Level-specific method
    expect(logger.addPatternFilter).toBeInstanceOf(Function);
    expect(logger.setFile).toBeInstanceOf(Function);
    expect(createFileTransport).toHaveBeenCalledWith({
      filename: 'test.log',
      format: 'json',
      logDir: './test/logs',
    });
  });

  // 2. Basic Logging
  test('log writes a simple message to transport', () => {
    logger.log('info', 'Simple message');
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'Simple message',
      })
    );
  });

  // 3. Logging with Metadata
  test('log includes metadata in output', () => {
    logger.log('error', 'Error occurred', { traceId: 'abc123' });
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'Error occurred',
        traceId: 'abc123',
      })
    );
  });

  // 4. Logging with Object as Message
  test('log handles object as message', () => {
    logger.log('info', { message: 'Object message', custom: 'data' });
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: { custom: 'data', message: 'Object message' },
      })
    );
  });

  // 5. Level-Specific Method
  test('info method logs correctly', () => {
    logger.info('Info log');
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'Info log',
      })
    );
  });

  // 6. KMP Pattern Matching
  test('findPattern matches patterns using KMP', () => {
    expect(logger.findPattern('test', 'This is a test string')).toBe(true);
    expect(logger.findPattern('xyz', 'This is a test string')).toBe(false);
    expect(logger.findPattern('test', 'TEST uppercase')).toBe(false); // Case-sensitive
    expect(logger.findPattern('', 'Non-empty')).toBe(false);
    expect(logger.findPattern('test', '')).toBe(false);
  });

  // 7. KMP Filter (Allow Pattern)
  test('addPatternFilter allows logs with pattern when allow=true', () => {
    logger.addPatternFilter('only-errors', 'Error', true);
    logger.log('info', 'Success message'); // Filtered out
    logger.log('error', 'Error message');  // Allowed
    expect(mockTransport.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Success message' })
    );
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error message' })
    );
  });

  // 8. KMP Filter (Exclude Pattern)
  test('addPatternFilter excludes logs with pattern when allow=false', () => {
    logger.addPatternFilter('no-errors', 'Error', false);
    logger.log('info', 'Success message'); // Allowed
    logger.log('error', 'Error message');  // Filtered out
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Success message' })
    );
    expect(mockTransport.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error message' })
    );
  });

  // 9. Multiple Filters
  test('multiple filters apply correctly', () => {
    logger.addPatternFilter('no-errors', 'Error', false);
    logger.addPatternFilter('only-success', 'Success', true);
    logger.log('info', 'Success message'); // Allowed (has success, no error)
    logger.log('error', 'Error message');  // Filtered out (has error)
    logger.log('info', 'Neutral message'); // Filtered out (no success)
    expect(mockTransport.log).toHaveBeenCalledTimes(1);
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Success message' })
    );
  });

  // 10. Remove Filter
  test('removeFilter disables filtering', () => {
    logger.addPatternFilter('no-errors', 'Error', false);
    logger.log('error', 'Error message'); // Filtered out
    logger.removeFilter('no-errors');
    logger.log('error', 'Error message'); // Now allowed
    expect(mockTransport.log).toHaveBeenCalledTimes(1);
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error message' })
    );
  });

  // 11. Processor Addition
  test('addProcessor modifies log info', () => {
    logger.addProcessor('uppercase', (info) => {
      info.message = info.message.toUpperCase();
    });
    logger.log('info', 'Process this');
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'PROCESS THIS',
      })
    );
  });

  // 12. Remove Processor
  test('removeProcessor stops modification', () => {
    logger.addProcessor('uppercase', (info) => {
      info.message = info.message.toUpperCase();
    });
    logger.removeProcessor('uppercase');
    logger.log('info', 'No change');
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'No change',
      })
    );
  });

  // 13. Set File
  test('setFile updates transport options', () => {
    logger.setFile({ filename: 'new.log', logDir: './new/logs' });
    expect(mockTransport.setFile).toHaveBeenCalledWith({
      filename: 'new.log',
      format: 'json',
      logDir: './new/logs',
    });
  });

  // 14. Edge Case: Null Message
  test('log handles null message', () => {
    logger.log('info', null);
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: null,
      })
    );
  });

  // 15. Edge Case: Empty Options
  test('createLogger works with empty options', () => {
    const emptyLogger = createLogger();
    expect(emptyLogger).toBeDefined();
    expect(createFileTransport).toHaveBeenCalledWith({});
    emptyLogger.log('info', 'Default log');
    expect(mockTransport.log).toHaveBeenCalled();
  });
});
