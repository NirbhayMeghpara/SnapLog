const SERVICES = {
  AUTH: 'auth-service',
  PAYMENT: 'payment-service',
  USER: 'user-service',
  ORDER: 'order-service'
};

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

const LOG_MESSAGES = {
  [LOG_LEVELS.INFO]: [
      'Service started successfully',
      'Request processed',
      'Operation completed',
      'Data synchronized'
  ],
  [LOG_LEVELS.WARN]: [
      'High memory usage detected',
      'Slow response time',
      'Rate limit approaching',
      'Connection unstable'
  ],
  [LOG_LEVELS.ERROR]: [
      'Database connection failed',
      'API request timeout',
      'Authentication failed',
      'Invalid data format'
  ],
  [LOG_LEVELS.CRITICAL]: [
      'System crash detected',
      'Security breach detected',
      'Data corruption found',
      'Service unavailable'
  ]
};

const HOSTS = {
  SERVER_1: 'server-01',
  SERVER_2: 'server-02',
  SERVER_3: 'server-03',
  SERVER_4: 'server-04'
};

export { SERVICES, LOG_LEVELS, LOG_MESSAGES, HOSTS };