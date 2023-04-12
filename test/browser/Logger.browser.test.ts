import { Page } from '@playwright/test'
import { WebpackHttpServer } from 'webpack-http-server'
import { test, expect } from '../../playwright.extend'
import { Logger as LoggerClass } from '../../src'

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
    `12:34:56:789 [test] first`,
    `12:34:56:789 [test] second`,
    `12:34:56:789 [test] third`,
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
    `12:34:56:789 ✔ [test] first`,
    `12:34:56:789 ✔ [test] second`,
    `12:34:56:789 ✔ [test] third`,
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
    `12:34:56:789 ⚠ [test] double-check this`,
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
    `12:34:56:789 ✖ [test] something went wrong`,
  ])
})

test('supports positionals', async ({ page, consoleMessages }) => {
  await loadRuntime(page)

  await page.evaluate(() => {
    globalThis.DEBUG = true

    const logger = new window.Logger('test')
    logger.debug('debug %d ("%s")', 123, 'abc', 'end')
    logger.info('info %d ("%s")', 123, 'abc', 'end')
    logger.success('success %d ("%s")', 123, 'abc', 'end')
    logger.warning('warning %d ("%s")', 123, 'abc', 'end')
    logger.error('error %d ("%s")', 123, 'abc', 'end')
  })

  /**
   * @note Playwright doesn't expose the resolved console messages.
   * They are correctly printed to the console so asserting the
   * arguments is enough.
   */
  expect(consoleMessages.get('log')).toEqual(
    expect.arrayContaining([`12:34:56:789 [test] debug %d ("%s") 123 abc end`])
  )
  expect(consoleMessages.get('log')).toEqual(
    expect.arrayContaining([`12:34:56:789 [test] info %d ("%s") 123 abc end`])
  )
  expect(consoleMessages.get('log')).toEqual(
    expect.arrayContaining([
      `12:34:56:789 ✔ [test] success %d ("%s") 123 abc end`,
    ])
  )
  expect(consoleMessages.get('warning')).toEqual(
    expect.arrayContaining([
      `12:34:56:789 ⚠ [test] warning %d ("%s") 123 abc end`,
    ])
  )
  expect(consoleMessages.get('error')).toEqual(
    expect.arrayContaining([
      `12:34:56:789 ✖ [test] error %d ("%s") 123 abc end`,
    ])
  )
})
