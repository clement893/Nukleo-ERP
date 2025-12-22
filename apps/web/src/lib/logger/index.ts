/**
 * Structured Logging for Frontend
 * Provides consistent logging with levels and context
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isDevelopment && level === LogLevel.DEBUG) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // Send to error tracking service in production (e.g., Sentry)
    if (level === LogLevel.ERROR && !this.isDevelopment) {
      // Use dynamic import to avoid bundling Sentry if not installed
      import('@/lib/sentry/client')
        .then(({ captureException }) => {
          const error = context?.error instanceof Error 
            ? context.error 
            : new Error(message);
          captureException(error, context);
        })
        .catch(() => {
          // Sentry not available or not configured, continue silently
        });
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : (error ? String(error) : '');
    const fullMessage = errorMessage ? `${message}: ${errorMessage}` : message;
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    this.log(LogLevel.ERROR, fullMessage, errorContext);
  }
}

export const logger = new Logger();

