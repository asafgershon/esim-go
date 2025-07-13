export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableColors: boolean;
  enableTimestamp: boolean;
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableColors: true,
      enableTimestamp: true,
      ...config,
    };
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.config.enableTimestamp 
      ? new Date().toISOString() 
      : '';
    
    const prefix = this.config.prefix ? `[${this.config.prefix}] ` : '';
    const dataStr = data ? ` ${JSON.stringify(data, null, 2)}` : '';
    
    return `${timestamp} ${prefix}${level}: ${message}${dataStr}`;
  }

  private getColorCode(level: LogLevel): string {
    if (!this.config.enableColors) return '';
    
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      default: return '';
    }
  }

  private resetColor(): string {
    return this.config.enableColors ? '\x1b[0m' : '';
  }

  private log(level: LogLevel, levelName: string, message: string, data?: any): void {
    if (level < this.config.level) return;

    const colorCode = this.getColorCode(level);
    const resetCode = this.resetColor();
    const formattedMessage = this.formatMessage(levelName, message, data);

    console.log(`${colorCode}${formattedMessage}${resetCode}`);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, data);
  }
}

// Default logger instance
export const logger = new Logger({
  level: process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG : LogLevel.INFO,
  enableColors: process.env.NODE_ENV !== 'production',
  enableTimestamp: true,
});

// Logger factory for creating loggers with specific prefixes
export function createLogger(prefix: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({
    ...config,
    prefix,
    level: process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG : LogLevel.INFO,
    enableColors: process.env.NODE_ENV !== 'production',
    enableTimestamp: true,
  });
} 