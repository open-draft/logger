import { test as base, expect } from '@playwright/test'

interface Fixtures {
  useFakeTimers(date: Date): void
  consoleMessages: Map<string, Array<string>>
}

const test = base.extend<Fixtures>({
  async useFakeTimers({ page }, use) {
    await use(async (date) => {
      const fakeNow = date.valueOf()

      await page.addInitScript(`{
// Extend Date constructor to default to fakeNow
Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      super(${fakeNow});
    } else {
      super(...args);
    }
  }
}
const __DateNowOffset = ${fakeNow} - Date.now();
const __DateNow = Date.now;
Date.now = () => __DateNow() + __DateNowOffset;
}`)
    })
  },
  async consoleMessages({ page }, use) {
    const messages = new Map()
    page.on('console', (message) => {
      const prevMessages = messages.get(message.type()) || []
      const text = message
        .text()
        .replace(
          /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
          ''
        )
      messages.set(message.type(), prevMessages.concat(text))
    })

    await use(messages)

    messages.clear()
  },
})

export { test, expect }
