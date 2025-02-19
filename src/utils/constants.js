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
      'Service started successfully',
      'Request processed',
      'Operation completed',
      'Data synchronized'
  ],
  [LOG_LEVELS_NAME.WARN]: [
      'High memory usage detected',
      'Slow response time',
      'Rate limit approaching',
      'Connection unstable'
  ],
  [LOG_LEVELS_NAME.ERROR]: [
      'Database connection failed',
      'API request timeout',
      'Authentication failed',
      'Invalid data format'
  ],
  [LOG_LEVELS_NAME.DEBUG]: [
      'Processing request parameters',
      'Query execution started',
      'Cache lookup performed',
      'Function execution trace'
  ]
};

const HOSTS = {
  SERVER_1: 'server-01',
  SERVER_2: 'server-02',
  SERVER_3: 'server-03',
  SERVER_4: 'server-04'
};

export { SERVICES, LOG_LEVELS_NAME, LOG_LEVELS, LEVEL_COLORS, LOG_MESSAGES, HOSTS };