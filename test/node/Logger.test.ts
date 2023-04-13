vi.stubEnv('DEBUG', 'true')

import { Logger } from '../../src/index'
import * as colors from '../../src/colors'

const logger = new Logger('parser')

beforeAll(() => {
  vi.spyOn(process.stdout, 'write')
  vi.spyOn(process.stderr, 'write')
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2023, 3, 1, 12, 34, 56, 789))
})

afterEach(() => {
  vi.resetAllMocks()
})

afterAll(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

it('prints a single info message', () => {
  logger.info('hello world')

  expect(process.stdout.write).toHaveBeenCalledWith(
    `${colors.gray('12:34:56:789')} ${colors.blue('[parser]')} hello world\n`
  )
})

it('prints multiple info messages', () => {
  logger.info('hello world')
  logger.info('hello world')

  expect(process.stdout.write).toHaveBeenCalledWith(
    `${colors.gray('12:34:56:789')} ${colors.blue('[parser]')} hello world\n`
  )
  expect(process.stdout.write).toHaveBeenCalledWith(
    `${colors.gray('12:34:56:789')} ${colors.blue('[parser]')} hello world\n`
  )
})

it('prints a success message', () => {
  logger.success('ok!')

  expect(process.stdout.write).toHaveBeenCalledWith(
    `${colors.green('12:34:56:789')} ${colors.green('✔ [parser]')} ok!\n`
  )
})

it('prints a warning message', () => {
  logger.warning('simple warning')

  expect(process.stderr.write).toHaveBeenCalledWith(
    `${colors.yellow('12:34:56:789')} ${colors.yellow(
      '⚠ [parser]'
    )} simple warning\n`
  )
})

it('prints an error message', () => {
  logger.error('oops')

  expect(process.stderr.write).toHaveBeenCalledWith(
    `${colors.red('12:34:56:789')} ${colors.red('✖ [parser]')} oops\n`
  )
})

it('supports positionals', () => {
  logger.debug('hello %s', 'world')
  expect(process.stdout.write).toHaveBeenCalledWith(
    `${colors.gray('12:34:56:789')} ${colors.gray('[parser]')} ${colors.gray(
      'hello world'
    )}\n`
  )

  logger.info('hello %s', 'world')
  expect(process.stdout.write).toHaveBeenCalledWith(
    `${colors.gray('12:34:56:789')} ${colors.blue('[parser]')} hello world\n`
  )

  logger.success('hello %s', 'world')
  expect(process.stdout.write).toHaveBeenCalledWith(
    `${colors.green('12:34:56:789')} ${colors.green(
      '✔ [parser]'
    )} hello world\n`
  )

  logger.warning('hello %s', 'world')
  expect(process.stderr.write).toHaveBeenCalledWith(
    `${colors.yellow('12:34:56:789')} ${colors.yellow(
      '⚠ [parser]'
    )} hello world\n`
  )

  logger.error('hello %s', 'world')
  expect(process.stderr.write).toHaveBeenCalledWith(
    `${colors.red('12:34:56:789')} ${colors.red('✖ [parser]')} hello world\n`
  )
})

it('serializes the input message', () => {
  logger.info({ hello: 'world' })
  expect(process.stdout.write).toHaveBeenCalledWith(
    `${colors.gray('12:34:56:789')} ${colors.blue(
      '[parser]'
    )} {"hello":"world"}\n`
  )

  logger.info([1, 'two', { three: 3 }])
  expect(process.stdout.write).toHaveBeenCalledWith(
    `${colors.gray('12:34:56:789')} ${colors.blue(
      '[parser]'
    )} [1,"two",{"three":3}]\n`
  )
})
