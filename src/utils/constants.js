const SERVICES = {
  AUTH: 'auth-service',
  PAYMENT: 'payment-service',
  USER: 'user-service',
  ORDER: 'order-service'
};

const LOG_LEVELS_NAME = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LEVEL_COLORS = {
  ERROR: 'red',
  WARN: 'yellow',
  INFO: 'blue',
  DEBUG: 'gray'
};

const LOG_MESSAGES = {
  [LOG_LEVELS_NAME.INFO]: [
    'Server started successfully on the assigned port',
    'Request processed for GET /api/users/123',
    'User session created and stored in cache',
    'Scheduled job executed without errors',
    'Configuration loaded from environment variables',
    'Database migration completed successfully',
    'Data synchronized with upstream server, 2500 records'
  ],
  [LOG_LEVELS_NAME.WARN]: [
    'High memory usage detected, approaching limit',
    'API response took longer than expected',
    'Retrying database connection due to transient issue',
    'Disk space is running low, less than 10% remaining',
    'External service responded with a delay, potential degradation',
    'Slow response time for POST /api/orders, 2500ms',
    'Rate limit approaching, 950/1000 requests per minute'
  ],
  [LOG_LEVELS_NAME.ERROR]: [
    'Failed to connect to the database, maximum retries reached',
    'API request timed out, no response from the server',
    'Unexpected error occurred while processing user authentication',
    'Invalid request payload, required fields missing',
    'Payment processing failed due to insufficient funds',
    'File write error, permission denied on /logs/app.log',
    'Network error, host unreachable at api.thirdparty.com'
  ],
  [LOG_LEVELS_NAME.DEBUG]: [
    'Received API request with query parameters',
    'Executing SQL query to fetch user data',
    'Cache lookup performed, key not found',
    'Function execution started with input parameters',
    'Parsed request body and validated input fields',
    'Processing request parameters: page=2, limit=10',
    'Socket connection opened to 127.0.0.1:5432'
  ]
};

const HOSTS = {
  SERVER_1: 'server-01',
  SERVER_2: 'server-02',
  SERVER_3: 'server-03',
  SERVER_4: 'server-04'
};

export { SERVICES, LOG_LEVELS_NAME, LOG_LEVELS, LEVEL_COLORS, LOG_MESSAGES, HOSTS };