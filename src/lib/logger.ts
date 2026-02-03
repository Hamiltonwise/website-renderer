import fs from 'fs';
import path from 'path';

// Log directory at project root
const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export type LogLevel = 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';

interface LoggerOptions {
  filename: string;
  prefix?: string;
}

/**
 * Create a logger instance for a specific log file
 */
export function createLogger(options: LoggerOptions) {
  const { filename, prefix = '' } = options;
  const logFilePath = path.join(LOG_DIR, filename);

  const formatMessage = (level: LogLevel, message: string, data?: Record<string, unknown>): string => {
    const timestamp = new Date().toISOString();
    const prefixStr = prefix ? `[${prefix}] ` : '';
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${prefixStr}[${level}] ${message}${dataStr}\n`;
  };

  const write = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    const logMessage = formatMessage(level, message, data);
    try {
      fs.appendFileSync(logFilePath, logMessage);
      // Also log to console
      if (level === 'ERROR') {
        console.error(logMessage.trim());
      } else {
        console.log(logMessage.trim());
      }
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  };

  return {
    info: (message: string, data?: Record<string, unknown>) => write('INFO', message, data),
    error: (message: string, data?: Record<string, unknown>) => write('ERROR', message, data),
    warn: (message: string, data?: Record<string, unknown>) => write('WARN', message, data),
    debug: (message: string, data?: Record<string, unknown>) => write('DEBUG', message, data),
  };
}

// Pre-configured loggers
export const scrapeLogger = createLogger({
  filename: 'website-scrape.log',
  prefix: 'SCRAPE',
});
