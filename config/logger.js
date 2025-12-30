import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// ✅ Check if running on Vercel/serverless
const isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // ✅ Always use Console transport for serverless
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} ${level}: ${stack || message}`;
        })
      ),
    }),
  ],
});

// ✅ Only add file transports in non-serverless environment
if (!isServerless) {
  try {
    const DailyRotateFile = (await import('winston-daily-rotate-file')).default;
    
    logger.add(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '14d',
        maxSize: '20m',
      })
    );
    
    logger.add(
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        maxSize: '20m',
      })
    );
  } catch (error) {
    console.warn('File logging not available:', error.message);
  }
}

export default logger;
