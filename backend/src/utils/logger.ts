import winston from 'winston';
import { config } from './config';

// Winston logger instance
export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.nodeEnv === 'production'
      ? winston.format.json()
      : winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level.toUpperCase()}] ${message}${stack ? '\n' + stack : ''}`;
        }),
  ),
  transports: [new winston.transports.Console()],
});
