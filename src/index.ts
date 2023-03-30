import { isNodeProcess } from 'is-node-process'
import * as colors from './colors'

const IS_NODE = isNodeProcess()

const LOGGER_NAME = getVariable('DEBUG')

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

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

    const isLoggingEnabled = LOGGER_NAME === '1' || LOGGER_NAME === 'true'
    const hasMatchingLogger =
      typeof LOGGER_NAME !== 'undefined' && this.name.startsWith(LOGGER_NAME)

    if (!isLoggingEnabled && !hasMatchingLogger) {
      this.info = noop
      this.success = noop
      this.warn = noop
      this.error = noop
    }
  }

  public extend(domain: string): Logger {
    return new Logger(`${this.name}:${domain}`)
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
}

const noop = () => void 0

function write(message: string): void {
  if (IS_NODE) {
    process.stdout.write(message + '\n')
    return
  }

  console.log(message)
}

function getVariable(variableName: string): string | undefined {
  if (typeof process !== 'undefined') {
    return process.env[variableName]
  }

  return globalThis[variableName]
}
