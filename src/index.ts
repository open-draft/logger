import { isNodeProcess } from 'is-node-process'
import * as colors from './colors'

const IS_NODE = isNodeProcess()

const LOGGER_NAME = getVariable('DEBUG')
const LOGGER_LEVEL = getVariable('LOG_LEVEL') as LogLevel | undefined

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

export type LogColors = keyof typeof colors

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
}

export class Logger {
  private prefix: string

  constructor(private readonly name: string) {
    this.prefix = `[${this.name}]`

    const isLoggingEnabled =
      LOGGER_NAME === '1' ||
      LOGGER_NAME === 'true' ||
      (typeof LOGGER_NAME !== 'undefined' && this.name.startsWith(LOGGER_NAME))

    if (isLoggingEnabled) {
      this.debug = isDefinedAndNotEquals(LOGGER_LEVEL, 'debug')
        ? noop
        : this.debug
      this.info = isDefinedAndNotEquals(LOGGER_LEVEL, 'info') ? noop : this.info
      this.success = isDefinedAndNotEquals(LOGGER_LEVEL, 'success')
        ? noop
        : this.success
      this.warn = isDefinedAndNotEquals(LOGGER_LEVEL, 'warn') ? noop : this.warn
      this.error = isDefinedAndNotEquals(LOGGER_LEVEL, 'error')
        ? noop
        : this.error
    } else {
      this.info = noop
      this.success = noop
      this.warn = noop
      this.error = noop
    }
  }

  public extend(domain: string): Logger {
    return new Logger(`${this.name}:${domain}`)
  }

  public debug(message: string): void {
    this.logEntry({
      level: 'debug',
      message: colors.gray(message),
      prefix: this.prefix,
      colors: {
        prefix: 'gray',
      },
    })
  }

  public info(message: string): void {
    this.logEntry({
      level: 'info',
      message,
      prefix: this.prefix,
      colors: {
        prefix: 'blue',
      },
    })
  }

  public success(message: string): void {
    this.logEntry({
      level: 'info',
      message,
      prefix: `✔ ${this.prefix}`,
      colors: {
        timestamp: 'green',
        prefix: 'green',
      },
    })
  }

  public warn(message: string): void {
    this.logEntry({
      level: 'warn',
      message,
      prefix: `⚠ ${this.prefix}`,
      colors: {
        timestamp: 'yellow',
        prefix: 'yellow',
      },
    })
  }

  public error(message: string): void {
    this.logEntry({
      level: 'error',
      message,
      prefix: `✖ ${this.prefix}`,
      colors: {
        timestamp: 'red',
        prefix: 'red',
      },
    })
  }

  /**
   * Execute the given callback only when the logging is enabled.
   * This is skipped in its entirety and has no runtime cost otherwise.
   * This executes regardless of the log level.
   */
  public only(callback: () => void): void {}

  private createEntry(level: LogLevel, message: string): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
    }
  }

  private logEntry(args: {
    level: LogLevel
    message: string
    prefix?: string
    colors?: {
      timestamp?: LogColors
      prefix?: LogColors
      message?: LogColors
    }
  }): void {
    const { level, message, prefix, colors: customColors } = args
    const entry = this.createEntry(level, message)
    const timestampColor = customColors?.timestamp || 'gray'
    const prefixColor = customColors?.prefix || 'gray'
    const colorize = {
      timestamp: colors[timestampColor],
      prefix: colors[prefixColor],
    }

    const write = this.getWriter(level)

    write(
      [colorize.timestamp(this.formatTimestamp(entry.timestamp))]
        .concat(prefix != null ? colorize.prefix(prefix) : [])
        .concat(message)
        .join(' ')
    )
  }

  private formatTimestamp(timestamp: Date): string {
    return `${timestamp.toLocaleTimeString(
      'en-GB'
    )}:${timestamp.getMilliseconds()}`
  }

  private getWriter(level: LogLevel) {
    switch (level) {
      case 'debug':
      case 'success':
      case 'info': {
        return log
      }
      case 'warn': {
        return warn
      }
      case 'error': {
        return error
      }
    }
  }
}

const noop = () => void 0

function log(message: string): void {
  if (IS_NODE) {
    process.stdout.write(message + '\n')
    return
  }

  console.log(message)
}

function warn(message: string): void {
  if (IS_NODE) {
    process.stderr.write(message + '\n')
    return
  }

  console.warn(message)
}

function error(message: string): void {
  if (IS_NODE) {
    process.stderr.write(message + '\n')
    return
  }

  console.error(message)
}

function getVariable(variableName: string): string | undefined {
  if (typeof process !== 'undefined') {
    return process.env[variableName]
  }

  return globalThis[variableName]
}

function isDefinedAndNotEquals(
  value: string | undefined,
  expected: string
): boolean {
  return value !== undefined && value !== expected
}
