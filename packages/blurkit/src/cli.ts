#!/usr/bin/env node
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { Command } from 'commander'
import fg from 'fast-glob'

import { encode } from './node'
import { createManifest, writeManifest } from './manifest'
import type { BlurKitOptions, BlurManifest, BlurResult } from './types'

interface CliOptions {
  algorithm?: 'blurhash' | 'thumbhash'
  size?: string
  width?: string
  height?: string
  format?: 'png' | 'jpeg'
  glob?: string
  out?: string
  basePath?: string
  concurrency?: string
  pretty?: boolean
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Expected a positive integer, received "${value}".`)
  }

  return parsed
}

function normalizeCliOptions(options: CliOptions): BlurKitOptions {
  return {
    algorithm: options.algorithm,
    size: toNumber(options.size),
    width: toNumber(options.width),
    height: toNumber(options.height),
    outputFormat: options.format,
  }
}

function isRemoteInput(input: string): boolean {
  return /^https?:\/\//i.test(input)
}

function toManifestKey(filePath: string, rootDir: string, basePath?: string): string {
  const relativePath = path.relative(rootDir, filePath).split(path.sep).join('/')

  if (basePath) {
    return `${basePath.replace(/\/$/, '')}/${relativePath}`.replace(/\/{2,}/g, '/')
  }

  const normalizedFile = filePath.split(path.sep).join('/')
  const publicMarker = '/public/'
  const publicIndex = normalizedFile.lastIndexOf(publicMarker)
  if (publicIndex !== -1) {
    return normalizedFile.slice(publicIndex + '/public'.length)
  }

  return relativePath
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(values.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < values.length) {
      const currentIndex = cursor
      cursor += 1
      results[currentIndex] = await mapper(values[currentIndex]!)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()))
  return results
}

async function encodePath(input: string, options: CliOptions): Promise<BlurResult | BlurManifest> {
  const parsedOptions = normalizeCliOptions(options)

  if (isRemoteInput(input)) {
    if (options.glob) {
      throw new Error('The --glob option is only valid for local directory input.')
    }

    return encode(input, parsedOptions)
  }

  const inputPath = path.resolve(input)
  const info = await stat(inputPath)

  if (!info.isDirectory() && !options.glob) {
    return encode(inputPath, parsedOptions)
  }

  const files = await fg(options.glob ?? '**/*.{jpg,jpeg,png,webp}', {
    cwd: inputPath,
    absolute: true,
    onlyFiles: true,
  })

  const concurrency = toNumber(options.concurrency) ?? 8
  const entries = await mapWithConcurrency(files, concurrency, async (filePath) => {
    const result = await encode(filePath, parsedOptions)
    return [toManifestKey(filePath, inputPath, options.basePath), result] as const
  })

  return createManifest(Object.fromEntries(entries))
}

const program = new Command()

program
  .name('blurkit')
  .description('Universal image placeholder generation.')

program
  .command('encode')
  .argument('<input>', 'Image path, directory, or remote URL')
  .option('--algorithm <algorithm>', 'blurhash or thumbhash')
  .option('--size <number>', 'Longest-side placeholder size')
  .option('--width <number>', 'Exact placeholder width')
  .option('--height <number>', 'Exact placeholder height')
  .option('--format <format>', 'png or jpeg')
  .option('--glob <pattern>', 'Glob pattern for directory manifests')
  .option('--out <file>', 'Write JSON output to a file')
  .option('--base-path <path>', 'Manifest key base path override')
  .option('--concurrency <number>', 'Directory encoding concurrency')
  .option('--pretty', 'Pretty-print JSON output')
  .action(async (input: string, options: CliOptions) => {
    const result = await encodePath(input, options)
    const json = JSON.stringify(result, null, options.pretty ? 2 : undefined)

    if (options.out) {
      if ('images' in result) {
        await writeManifest(options.out, result, { pretty: options.pretty })
      } else {
        const outputPath = path.resolve(options.out)
        await mkdir(path.dirname(outputPath), { recursive: true })
        await writeFile(outputPath, json, 'utf8')
      }
      return
    }

    process.stdout.write(`${json}\n`)
  })

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
