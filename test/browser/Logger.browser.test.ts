import { Page } from '@playwright/test'
import { WebpackHttpServer } from 'webpack-http-server'
import { test, expect } from '../../playwright.extend'
import { Logger as LoggerClass } from '../../src'
import * as colors from '../../src/colors'

declare namespace window {
  export const Logger: typeof LoggerClass
}

const webpackServer = new WebpackHttpServer({
  webpackConfig: {
    resolve: {
      alias: {
        '@open-draft/logger': require.resolve('../..'),
      },
    },
  },
})

test.beforeAll(async () => {
  await webpackServer.listen()
})

test.beforeEach(({ useFakeTimers }) => {
  useFakeTimers(new Date(2023, 3, 1, 12, 34, 56, 789))
})

test.afterAll(async () => {
  await webpackServer.close()
})

async function loadRuntime(page: Page) {
  const compilation = await webpackServer.compile([
    require.resolve('./runtime.js'),
  ])

  await page.goto(compilation.previewUrl, { waitUntil: 'networkidle' })
}

test('prints info messages', async ({ page, consoleMessages }) => {
  await loadRuntime(page)

  await page.evaluate(() => {
    globalThis.DEBUG = true

    const logger = new window.Logger('test')
    logger.info('first')
    logger.info('second')
    logger.info('third')
  })

  expect(consoleMessages.get('log')).toEqual([
    `${colors.gray('12:34:56:789')} ${colors.blue('[test]')} first`,
    `${colors.gray('12:34:56:789')} ${colors.blue('[test]')} second`,
    `${colors.gray('12:34:56:789')} ${colors.blue('[test]')} third`,
  ])
})

test('prints success messages', async ({ page, consoleMessages }) => {
  await loadRuntime(page)

  await page.evaluate(() => {
    globalThis.DEBUG = true

    const logger = new window.Logger('test')
    logger.success('first')
    logger.success('second')
    logger.success('third')
  })

  expect(consoleMessages.get('log')).toEqual([
    `${colors.green('12:34:56:789')} ${colors.green('✔ [test]')} first`,
    `${colors.green('12:34:56:789')} ${colors.green('✔ [test]')} second`,
    `${colors.green('12:34:56:789')} ${colors.green('✔ [test]')} third`,
  ])
})

test('prints warning messages', async ({ page, consoleMessages }) => {
  await loadRuntime(page)

  await page.evaluate(() => {
    globalThis.DEBUG = true

    const logger = new window.Logger('test')
    logger.warning('double-check this')
  })

  expect(consoleMessages.get('warning')).toEqual([
    `${colors.yellow('12:34:56:789')} ${colors.yellow(
      '⚠ [test]'
    )} double-check this`,
  ])
})

test('prints error messages', async ({ page, consoleMessages }) => {
  await loadRuntime(page)

  await page.evaluate(() => {
    globalThis.DEBUG = true

    const logger = new window.Logger('test')
    logger.error('something went wrong')
  })

  expect(consoleMessages.get('error')).toEqual([
    `${colors.red('12:34:56:789')} ${colors.red(
      '✖ [test]'
    )} something went wrong`,
  ])
})
