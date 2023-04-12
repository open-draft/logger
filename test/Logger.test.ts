import { Logger } from '../src'

const logger = new Logger('parser')

it('prints an info message', async () => {
  logger.info('configuring parser...')
  logger.info('start parsing...')
  logger.warn('exceeding memory limit')
  logger.error('failed to find a valid parser')
  logger.success('finished parsing!')

  const log = logger.extend('normalizeArgs')
  log.warn('footer')
  log.info('got argument')
})
