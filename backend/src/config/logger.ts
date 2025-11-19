import winston from 'winston';
import path from 'path';
import { LOG_ROTATION } from '../constants';

/**
 * Get log level based on NODE_ENV
 * - development: debug
 * - production: info
 * - test: error
 */
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL;
  
  if (logLevel) {
    return logLevel;
  }
  
  switch (env) {
    case 'production':
      return 'info';
    case 'test':
      return 'error';
    case 'development':
    default:
      return 'debug';
  }
};

/**
 * Custom log format with timestamp and colorization
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format with colors for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

/**
 * Create logs directory if it doesn't exist
 */
const logsDir = path.join(process.cwd(), 'logs');

/**
 * Winston logger instance with console and file transports
 */
export const logger = winston.createLogger({
  level: getLogLevel(),
  format: logFormat,
  defaultMeta: { service: 'visa-evaluation-api' },
  transports: [
    // Console transport with colorized output
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Error log file - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: LOG_ROTATION.MAX_SIZE,
      maxFiles: LOG_ROTATION.MAX_FILES
    }),
    
    // Combined log file - all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: LOG_ROTATION.MAX_SIZE,
      maxFiles: LOG_ROTATION.MAX_FILES
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

/**
 * Stream for Morgan HTTP request logging
 */
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Log initialization
logger.info(`Logger initialized with level: ${getLogLevel()}`);
