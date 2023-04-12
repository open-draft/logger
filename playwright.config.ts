import { Config } from '@playwright/test'

const config: Config = {
  testDir: 'test/browser',
  use: {
    launchOptions: {
      devtools: true,
    },
  },
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
}

export default config
