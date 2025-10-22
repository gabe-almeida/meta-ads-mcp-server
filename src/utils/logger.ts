/**
 * Structured logging utility
 * Writes JSON-formatted logs to stderr (stdout is reserved for MCP protocol)
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: LogContext;
}

class Logger {
  private minLevel: LogLevel;
  private readonly levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  constructor() {
    this.minLevel = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    return level && level in this.levels ? level : 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.minLevel];
  }

  private write(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...(context && { context }),
    };

    // Write to stderr (not stdout, which is used for MCP protocol)
    console.error(JSON.stringify(entry));
  }

  error(message: string, context?: LogContext): void {
    this.write('error', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.write('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.write('debug', message, context);
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.shouldLog('debug');
  }
}

// Export singleton instance
export const logger = new Logger();
