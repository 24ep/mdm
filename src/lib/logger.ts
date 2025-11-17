/**
 * Centralized Logging System
 * Replaces console.log/error/warn with structured logging
 */

import { sendLogToElasticsearch } from './elasticsearch-client'

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
      
      // Send to Elasticsearch (fire and forget)
      sendLogToElasticsearch('application', {
        level: 'debug',
        message,
        ...context,
        environment: this.isProduction ? 'production' : 'development'
      }).catch(() => {}) // Silently fail
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
      
      // Send to Elasticsearch (fire and forget)
      sendLogToElasticsearch('application', {
        level: 'info',
        message,
        ...context,
        environment: this.isProduction ? 'production' : 'development'
      }).catch(() => {}) // Silently fail
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
      
      // Send to Elasticsearch (fire and forget)
      sendLogToElasticsearch('application', {
        level: 'warn',
        message,
        ...context,
        environment: this.isProduction ? 'production' : 'development'
      }).catch(() => {}) // Silently fail
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
      
      // Send to Elasticsearch (fire and forget)
      sendLogToElasticsearch('application', {
        level: 'error',
        message,
        ...errorContext,
        environment: this.isProduction ? 'production' : 'development'
      }).catch(() => {}) // Silently fail
    }
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context)
    
    // Also send structured API request log to Elasticsearch
    sendLogToElasticsearch('application', {
      level: 'info',
      message: `API ${method} ${path}`,
      type: 'api_request',
      method,
      path,
      ...context,
      environment: this.isProduction ? 'production' : 'development'
    }).catch(() => {})
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
    this[level](`API ${method} ${path} ${status} (${duration}ms)`, context)
    
    // Also send structured API response log to Elasticsearch
    sendLogToElasticsearch('application', {
      level,
      message: `API ${method} ${path} ${status} (${duration}ms)`,
      type: 'api_response',
      method,
      path,
      statusCode: status,
      duration,
      ...context,
      environment: this.isProduction ? 'production' : 'development'
    }).catch(() => {})
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
    
    // Also send structured DB query log to Elasticsearch
    sendLogToElasticsearch('application', {
      level: 'debug',
      message: 'Database query',
      type: 'db_query',
      query: query.substring(0, 200),
      duration,
      ...context,
      environment: this.isProduction ? 'production' : 'development'
    }).catch(() => {})
  }

  /**
   * Log database error
   */
  dbError(query: string, error: Error, context?: LogContext): void {
    this.error('Database error', error, {
      ...context,
      query: query.substring(0, 200),
    })
    
    // Also send structured DB error log to Elasticsearch
    sendLogToElasticsearch('application', {
      level: 'error',
      message: 'Database error',
      type: 'db_error',
      query: query.substring(0, 200),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context,
      environment: this.isProduction ? 'production' : 'development'
    }).catch(() => {})
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for dependency injection
export type LoggerInstance = Logger

