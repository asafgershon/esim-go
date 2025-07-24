import { type Logger as PinoLogger } from 'pino';
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
export declare class StructuredLogger {
    private pinoLogger;
    private correlationId?;
    private context;
    constructor(context?: LogContext, pinoLogger?: PinoLogger);
    private enrichContext;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error, context?: LogContext): void;
    logPerformance(metrics: PerformanceMetrics): void;
    child(childContext: LogContext): StructuredLogger;
    getCorrelationId(): string;
    setCorrelationId(correlationId: string): void;
}
export declare function withPerformanceLogging<T>(logger: StructuredLogger, operation: string, fn: () => Promise<T>, context?: Record<string, any>): Promise<T>;
export declare function createLogger(context: LogContext): StructuredLogger;
export declare const logger: StructuredLogger;
