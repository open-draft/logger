# Logger

Environment-agnostic, ESM-friendly logger for simple needs.

## Why does this exist?

I've been using `debug` for quite some time but wanted to migrate my projects to better ESM support. Alas, `debug` doesn't ship as ESM so I went and wrote this little logger just for my needs. You will likely see it printing useful data in Mock Service Worker and beyond.

## Installation

```sh
npm install @open-draft/logger
```

## Usage

This package has the same API for both browser and Node.js and can run in those environments out of the box.

```js
import { Logger } from '@open-draft/logger'

const logger = new Logger('parser')

logger.info('starting parsing...')
logger.warning('found legacy document format')
logger.success('parsed 120 documents!')
```

## API

- Class: `Logger`
  - [`new Logger(name)`](#new-loggername)
  - [`logger.debug(message)`](#loggerdebugmessage)
  - [`logger.info(message)`](#loggerinfomessage)
  - [`logger.success(message)`](#loggersuccessmessage)
  - [`logger.warning(message)`](#loggerwarningmessage)
  - [`logger.error(message)`](#loggererrormessage)
  - [`logger.extend(name)`](#loggerextendprefix)
  - [`logger.only(callback)`](#loggeronlycallback)

### `new Logger(name)`

- `name` `string` the name of the logger.

Creates a new instance of the logger. Each message printed by the logger will be prefixed with the given `name`. You can have multiple loggers with different names for different areas of your system.

```js
const logger = new Logger('parser')
```

> You can nest loggers via [`logger.extend()`](#loggerextendprefix).

### `logger.debug(message)`

- `message` `string`

Prints a debug message.

```js
logger.debug('no duplicates found, skipping...')
```

```
12:34:56:789 [parser] no duplicates found, skipping...
```

### `logger.info(message)`

- `message` `string`

Prints an info message.

```js
logger.info('new parse request')
```

```
12:34:56:789 [parser] new parse request
```

### `logger.success(message)`

- `message` `string`

Prints a success message.

```js
logger.success('prased 123 documents!')
```

```
12:34:56:789 ✔ [parser] prased 123 documents!
```

### `logger.warning(message)`

- `message` `string`

Prints a warning. In Node.js, prints it to `process.stderr`.

```js
logger.warning('found legacy document format')
```

```
12:34:56:789 ⚠ [parser] found legacy document format
```

### `logger.error(message)`

- `message` `string`

Prints an error. In Node.js, prints it to `process.stderr`.

```js
logger.error('failed to parse document')
```

```
12:34:56:789 ✖ [parser] failed to parse document
```

### `logger.extend(prefix)`

- `prefix` `string` Additional prefix to append to the logger's name.

Creates a new logger out of the current one.

```js
const logger = new Logger('parser')

function parseRequest(request) {
  const requestLogger = logger.extend(`${request.method} ${request.url}`)
  requestLogger.info('start parsing...')
}
```

```
12:34:56:789 [parser] [GET https://example.com] start parsing...
```

### `logger.only(callback)`

Executes a given callback only when the logging is activated. Useful for computing additional information for logs.

```js
logger.only(() => {
  const documentSize = getSizeBytes(document)
  logger.debug(`document size: ${documentSize}`)
})
```

> You can nest `logger.*` methods in the callback to `logger.only()`.
