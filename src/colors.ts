export type ColorFunction = (text: string) => void

export function yellow(text: string) {
  return `\x1b[33m${text}\x1b[0m`
}

export function blue(text: string) {
  return `\x1b[34m${text}\x1b[0m`
}

export function gray(text: string) {
  return `\x1b[90m${text}\x1b[0m`
}

export function red(text: string) {
  return `\x1b[31m${text}\x1b[0m`
}

export function green(text: string) {
  return `\x1b[32m${text}\x1b[0m`
}
