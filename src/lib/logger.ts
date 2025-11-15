/**
 * Centralized Logging System
 * Replaces console.log/error/warn with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warn and error
    if (this.isProduction) {
      return level === 'warn' || level === 'error'
    }
    // In development, log everything
    return true
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      }
      console.error(this.formatMessage('error', message, errorContext))
    }
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context)
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
    this[level](`API ${method} ${path} ${status} (${duration}ms)`, context)
  }

  /**
   * Log database query
   */
  dbQuery(query: string, duration?: number, context?: LogContext): void {
    this.debug('Database query', {
      ...context,
      query: query.substring(0, 200), // Truncate long queries
      duration,
    })
  }

  /**
   * Log database error
   */
  dbError(query: string, error: Error, context?: LogContext): void {
    this.error('Database error', error, {
      ...context,
      query: query.substring(0, 200),
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for dependency injection
export type LoggerInstance = Logger

