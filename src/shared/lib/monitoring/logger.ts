import { sendLogToElasticsearch } from '@/lib/elasticsearch-client'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, any>
  timestamp?: Date
  userId?: string
  spaceId?: string
}

/**
 * Structured logger
 */
export class Logger {
  private context: Record<string, any> = {}

  constructor(context?: Record<string, any>) {
    this.context = context || {}
  }

  private log(level: LogLevel, message: string, data?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...data },
    }

    // In production, send to logging service
    // For now, use console with structured format
    const logMessage = JSON.stringify(entry)
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage)
        break
      case LogLevel.INFO:
        console.info(logMessage)
        break
      case LogLevel.WARN:
        console.warn(logMessage)
        break
      case LogLevel.ERROR:
        console.error(logMessage)
        break
    }

    // Send to Elasticsearch (fire and forget)
    sendLogToElasticsearch('monitoring', {
      level: level.toString(),
      message,
      ...entry.context,
      userId: entry.userId,
      spaceId: entry.spaceId,
      timestamp: entry.timestamp?.toISOString()
    }).catch(() => {}) // Silently fail
  }

  debug(message: string, data?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: Record<string, any>) {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: Record<string, any>) {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, error?: Error | unknown, data?: Record<string, any>) {
    const errorData = {
      ...data,
      error: error instanceof Error 
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    }
    this.log(LogLevel.ERROR, message, errorData)
  }

  withContext(context: Record<string, any>): Logger {
    return new Logger({ ...this.context, ...context })
  }
}

// Default logger instance
export const logger = new Logger()

