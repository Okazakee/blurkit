import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FALLBACK_VERSION = 'unknown'
const BASE_NPM_URL = 'https://www.npmjs.com/package/blurkit'

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- validates the version field of the parsed package.json
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function readBlurkitVersion() {
  try {
    const candidates = [
      resolve(process.cwd(), 'packages/blurkit/package.json'),
      resolve(process.cwd(), '../../packages/blurkit/package.json'),
      new URL('../../../../packages/blurkit/package.json', import.meta.url),
    ]

    for (const candidate of candidates) {
      if (!(candidate instanceof URL) && !existsSync(candidate)) continue
      const packageJson: { version?: unknown } = JSON.parse(readFileSync(candidate, 'utf8'))
      return isNonEmptyString(packageJson.version) ? packageJson.version : FALLBACK_VERSION
    }

    return FALLBACK_VERSION
  } catch {
    return FALLBACK_VERSION
  }
}

export const BLURKIT_VERSION = readBlurkitVersion()

export const BLURKIT_NPM_VERSION_URL =
  BLURKIT_VERSION === FALLBACK_VERSION ? BASE_NPM_URL : `${BASE_NPM_URL}/v/${BLURKIT_VERSION}`
