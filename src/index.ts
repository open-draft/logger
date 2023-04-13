import { isNodeProcess } from 'is-node-process'
import { format } from 'outvariant'
import * as colors from './colors'

const IS_NODE = isNodeProcess()

export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error'

export type LogColors = keyof typeof colors

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: any
}

export class Logger {
  private prefix: string

  constructor(private readonly name: string) {
    this.prefix = `[${this.name}]`

    const LOGGER_NAME = getVariable('DEBUG')
    const LOGGER_LEVEL = getVariable('LOG_LEVEL') as LogLevel | undefined

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
      this.warning = isDefinedAndNotEquals(LOGGER_LEVEL, 'warning')
        ? noop
        : this.warning
      this.error = isDefinedAndNotEquals(LOGGER_LEVEL, 'error')
        ? noop
        : this.error
    } else {
      this.info = noop
      this.success = noop
      this.warning = noop
      this.error = noop
      this.only = noop
    }
  }

  public extend(domain: string): Logger {
    return new Logger(`${this.name}:${domain}`)
  }

  /**
   * Print a debug message.
   * @example
   * logger.debug('no duplicates found, creating a document...')
   */
  public debug(message: any, ...positionals: Array<unknown>): void {
    this.logEntry({
      level: 'debug',
      message: colors.gray(message),
      positionals,
      prefix: this.prefix,
      colors: {
        prefix: 'gray',
      },
    })
  }

  /**
   * Print an info message.
   * @example
   * logger.info('start parsing...')
   */
  public info(message: any, ...positionals: Array<unknown>) {
    this.logEntry({
      level: 'info',
      message,
      positionals,
      prefix: this.prefix,
      colors: {
        prefix: 'blue',
      },
    })

    const performance = new PerformanceEntry()

    return (message: any, ...positionals: Array<unknown>) => {
      performance.measure()

      this.logEntry({
        level: 'info',
        message: `${message} ${colors.gray(`${performance.deltaTime}ms`)}`,
        positionals,
        prefix: this.prefix,
        colors: {
          prefix: 'blue',
        },
      })
    }
  }

  /**
   * Print a success message.
   * @example
   * logger.success('successfully created document')
   */
  public success(message: any, ...positionals: Array<unknown>): void {
    this.logEntry({
      level: 'info',
      message,
      positionals,
      prefix: `✔ ${this.prefix}`,
      colors: {
        timestamp: 'green',
        prefix: 'green',
      },
    })
  }

  /**
   * Print a warning.
   * @example
   * logger.warning('found legacy document format')
   */
  public warning(message: any, ...positionals: Array<unknown>): void {
    this.logEntry({
      level: 'warning',
      message,
      positionals,
      prefix: `⚠ ${this.prefix}`,
      colors: {
        timestamp: 'yellow',
        prefix: 'yellow',
      },
    })
  }

  /**
   * Print an error message.
   * @example
   * logger.error('something went wrong')
   */
  public error(message: any, ...positionals: Array<unknown>): void {
    this.logEntry({
      level: 'error',
      message,
      positionals,
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
   * @example
   * logger.only(() => {
   *   logger.info('additional info')
   * })
   */
  public only(callback: () => void): void {
    callback()
  }

  private createEntry(level: LogLevel, message: unknown): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
    }
  }

  private logEntry(args: {
    level: LogLevel
    message: unknown
    positionals?: Array<unknown>
    prefix?: string
    colors?: {
      timestamp?: LogColors
      prefix?: LogColors
      message?: LogColors
    }
  }): void {
    const {
      level,
      message,
      prefix,
      colors: customColors,
      positionals = [],
    } = args
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
        .concat(serializeInput(message))
        .join(' '),
      ...positionals.map(serializeInput)
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
      case 'warning': {
        return warn
      }
      case 'error': {
        return error
      }
    }
  }
}

class PerformanceEntry {
  private readonly startTime: number
  public endTime: number
  public deltaTime: string

  constructor() {
    this.startTime = performance.now()
  }

  public measure(): void {
    this.endTime = performance.now()
    const deltaTime = this.endTime - this.startTime
    this.deltaTime = deltaTime.toFixed(2)
  }
}

const noop = () => void 0

function log(message: string, ...positionals: Array<unknown>): void {
  if (IS_NODE) {
    process.stdout.write(format(message, ...positionals) + '\n')
    return
  }

  console.log(message, ...positionals)
}

function warn(message: string, ...positionals: Array<unknown>): void {
  if (IS_NODE) {
    process.stderr.write(format(message, ...positionals) + '\n')
    return
  }

  console.warn(message, ...positionals)
}

function error(message: string, ...positionals: Array<unknown>): void {
  if (IS_NODE) {
    process.stderr.write(format(message, ...positionals) + '\n')
    return
  }

  console.error(message, ...positionals)
}

/**
 * Return an environmental variable value.
 * When run in the browser, returns the value of the global variable
 * of the same name.
 */
function getVariable(variableName: string): string | undefined {
  if (IS_NODE) {
    return process.env[variableName]
  }

  return globalThis[variableName]?.toString()
}

function isDefinedAndNotEquals(
  value: string | undefined,
  expected: string
): boolean {
  return value !== undefined && value !== expected
}

function serializeInput(message: any): string {
  if (typeof message === 'undefined') {
    return 'undefined'
  }

  if (message === null) {
    return 'null'
  }

  if (typeof message === 'string') {
    return message
  }

  if (typeof message === 'object') {
    return JSON.stringify(message)
  }

  return message.toString()
}
