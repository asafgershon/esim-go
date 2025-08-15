"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.StructuredLogger = void 0;
exports.withPerformanceLogging = withPerformanceLogging;
exports.createLogger = createLogger;
const pino_1 = __importDefault(require("pino"));
// Simple ID generation (avoiding nanoid for reduced dependencies)
function generateId() {
    return Math.random().toString(36).substring(2, 12);
}
// Create base Pino logger with structured configuration
const createBaseLogger = () => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
    return (0, pino_1.default)({
        level: logLevel,
        formatters: {
            level: (label) => ({ level: label.toUpperCase() }),
        },
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
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
class StructuredLogger {
    pinoLogger;
    correlationId;
    context;
    constructor(context = {}, pinoLogger) {
        this.pinoLogger = pinoLogger || createBaseLogger();
        this.correlationId = context.correlationId || generateId();
        this.context = { ...context, correlationId: this.correlationId };
    }
    enrichContext(additionalContext = {}) {
        return {
            ...this.context,
            ...additionalContext,
            correlationId: this.correlationId,
        };
    }
    debug(message, context) {
        this.pinoLogger.debug(this.enrichContext(context), message);
    }
    info(message, context) {
        this.pinoLogger.info(this.enrichContext(context), message);
    }
    warn(message, context) {
        this.pinoLogger.warn(this.enrichContext(context), message);
    }
    error(message, error, context) {
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
    logPerformance(metrics) {
        this.pinoLogger.info(this.enrichContext({
            operationType: 'performance',
            operation: metrics.operation,
            duration: metrics.duration,
            ...metrics.context,
        }), `Performance: ${metrics.operation} completed in ${metrics.duration}ms`);
    }
    // Create child logger with additional context
    child(childContext) {
        const newContext = this.enrichContext(childContext);
        return new StructuredLogger(newContext, this.pinoLogger.child(newContext));
    }
    // Get correlation ID for tracing
    getCorrelationId() {
        return this.correlationId;
    }
    // Set correlation ID (useful for request tracing)
    setCorrelationId(correlationId) {
        this.correlationId = correlationId;
        this.context.correlationId = correlationId;
    }
}
exports.StructuredLogger = StructuredLogger;
// Performance tracking helper
function withPerformanceLogging(logger, operation, fn, context) {
    return new Promise(async (resolve, reject) => {
        const start = Date.now();
        try {
            logger.debug(`Starting ${operation}`, { operationType: operation, ...context });
            const result = await fn();
            const duration = Date.now() - start;
            logger.logPerformance({ operation, duration, context });
            resolve(result);
        }
        catch (error) {
            const duration = Date.now() - start;
            logger.error(`Failed ${operation}`, error, {
                operationType: operation,
                duration,
                ...context
            });
            reject(error);
        }
    });
}
// Logger factory for creating loggers with specific context
function createLogger(context) {
    return new StructuredLogger({
        service: 'esim-go',
        ...context,
    });
}
// Default logger instance
exports.logger = new StructuredLogger({
    service: 'esim-go',
});
