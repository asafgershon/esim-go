import pino, { Logger as PinoLogger } from 'pino';
import { nanoid } from 'nanoid';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  operationType?: string;
  code?: string;
  duration?: number;
  [key: string]: any;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  correlationId?: string;
  context?: Record<string, any>;
}

// Create base Pino logger with structured configuration
const createBaseLogger = (): PinoLogger => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

  return pino({
    level: logLevel,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    }),
  });
};

export class StructuredLogger {
  private pinoLogger: PinoLogger;
  private correlationId?: string;
  private context: LogContext;

  constructor(context: LogContext = {}, pinoLogger?: PinoLogger) {
    this.pinoLogger = pinoLogger || createBaseLogger();
    this.correlationId = context.correlationId || nanoid(10);
    this.context = { ...context, correlationId: this.correlationId };
  }

  private enrichContext(additionalContext: LogContext = {}): LogContext {
    return {
      ...this.context,
      ...additionalContext,
      correlationId: this.correlationId,
    };
  }

  debug(message: string, context?: LogContext): void {
    this.pinoLogger.debug(this.enrichContext(context), message);
  }

  info(message: string, context?: LogContext): void {
    this.pinoLogger.info(this.enrichContext(context), message);
  }

  warn(message: string, context?: LogContext): void {
    this.pinoLogger.warn(this.enrichContext(context), message);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...this.enrichContext(context),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };
    this.pinoLogger.error(errorContext, message);
  }

  // Performance logging for critical operations
  logPerformance(metrics: PerformanceMetrics): void {
    this.pinoLogger.info(
      this.enrichContext({
        operationType: 'performance',
        operation: metrics.operation,
        duration: metrics.duration,
        ...metrics.context,
      }),
      `Performance: ${metrics.operation} completed in ${metrics.duration}ms`
    );
  }

  // Create child logger with additional context
  child(childContext: LogContext): StructuredLogger {
    const newContext = this.enrichContext(childContext);
    return new StructuredLogger(newContext, this.pinoLogger.child(newContext));
  }

  // Get correlation ID for tracing
  getCorrelationId(): string {
    return this.correlationId!;
  }

  // Set correlation ID (useful for request tracing)
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
    this.context.correlationId = correlationId;
  }
}

// Performance tracking helper
export function withPerformanceLogging<T>(
  logger: StructuredLogger,
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now();
    try {
      logger.debug(`Starting ${operation}`, { operationType: operation, ...context });
      const result = await fn();
      const duration = Date.now() - start;
      logger.logPerformance({ operation, duration, context });
      resolve(result);
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Failed ${operation}`, error as Error, { 
        operationType: operation, 
        duration,
        ...context 
      });
      reject(error);
    }
  });
}

// Default logger instance
export const logger = new StructuredLogger({
  service: 'esim-go-server',
});

// Logger factory for creating loggers with specific context
export function createLogger(context: LogContext): StructuredLogger {
  return new StructuredLogger({
    service: 'esim-go-server',
    ...context,
  });
}

// Legacy compatibility - maintain existing interface while using structured logging
export const compatLogger = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, data?: any) => {
    if (data instanceof Error) {
      logger.error(message, data);
    } else {
      logger.error(message, undefined, data);
    }
  },
}; 