#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

function run(command, args, cwd = process.cwd()) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function parsePackJson(raw) {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Unable to parse npm pack JSON output.')
  }

  const payload = raw.slice(start, end + 1)
  const parsed = JSON.parse(payload)
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('npm pack JSON output did not contain package data.')
  }

  return parsed[0]
}

function computeDistMetrics(packageDir) {
  const distDir = path.join(packageDir, 'dist')
  const files = readdirSync(distDir)

  const metrics = {
    fileCount: 0,
    rawBytesTotal: 0,
    gzipBytesTotal: 0,
    jsBytes: 0,
    cjsBytes: 0,
    dtsBytes: 0,
    mapBytes: 0,
    otherBytes: 0,
  }

  for (const file of files) {
    const fullPath = path.join(distDir, file)
    const fileStat = statSync(fullPath)
    if (!fileStat.isFile()) {
      continue
    }

    const bytes = readFileSync(fullPath)
    const raw = bytes.length
    const gzip = zlib.gzipSync(bytes, { level: 9 }).length

    metrics.fileCount += 1
    metrics.rawBytesTotal += raw
    metrics.gzipBytesTotal += gzip

    if (file.endsWith('.d.ts') || file.endsWith('.d.cts')) {
      metrics.dtsBytes += raw
    } else if (file.endsWith('.cjs')) {
      metrics.cjsBytes += raw
    } else if (file.endsWith('.js')) {
      metrics.jsBytes += raw
    } else if (file.endsWith('.map')) {
      metrics.mapBytes += raw
    } else {
      metrics.otherBytes += raw
    }
  }

  return metrics
}

function collectPackageReport(packageDir, packageLabel) {
  const packageJsonPath = path.join(packageDir, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  const packRaw = run('npm', ['pack', '--json', '--dry-run'], packageDir)
  const pack = parsePackJson(packRaw)
  const dist = computeDistMetrics(packageDir)

  return {
    label: packageLabel,
    name: packageJson.name,
    version: packageJson.version,
    npmPack: {
      tarballBytes: pack.size,
      unpackedBytes: pack.unpackedSize,
      entryCount: pack.entryCount,
      filename: pack.filename,
    },
    dist,
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function renderMarkdown(report) {
  const lines = []
  lines.push('# Library Size Report')
  lines.push('')
  lines.push(`- Generated: ${report.generatedAt}`)
  lines.push(`- Ref: ${report.git.ref}`)
  lines.push(`- SHA: ${report.git.sha}`)
  lines.push(`- Event: ${report.git.eventName}`)
  lines.push('')
  lines.push('## npm pack summary')
  lines.push('')
  lines.push('| Package | Version | Tarball | Unpacked | Entries |')
  lines.push('| --- | --- | ---: | ---: | ---: |')

  for (const pkg of report.packages) {
    lines.push(`| ${pkg.name} | ${pkg.version} | ${formatBytes(pkg.npmPack.tarballBytes)} | ${formatBytes(pkg.npmPack.unpackedBytes)} | ${pkg.npmPack.entryCount} |`)
  }

  lines.push('')
  lines.push('## dist footprint summary')
  lines.push('')
  lines.push('| Package | Files | Raw total | Gzip total | JS | CJS | DTS | MAP | Other |')
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')

  for (const pkg of report.packages) {
    lines.push(
      `| ${pkg.name} | ${pkg.dist.fileCount} | ${formatBytes(pkg.dist.rawBytesTotal)} | ${formatBytes(pkg.dist.gzipBytesTotal)} | ${formatBytes(pkg.dist.jsBytes)} | ${formatBytes(pkg.dist.cjsBytes)} | ${formatBytes(pkg.dist.dtsBytes)} | ${formatBytes(pkg.dist.mapBytes)} | ${formatBytes(pkg.dist.otherBytes)} |`,
    )
  }

  lines.push('')
  return `${lines.join('\n')}\n`
}

function main() {
  const repoRoot = process.cwd()
  const artifactsDir = path.join(repoRoot, 'artifacts')
  mkdirSync(artifactsDir, { recursive: true })

  const blurkitDir = path.join(repoRoot, 'packages', 'blurkit')
  const codecsDir = path.join(repoRoot, 'packages', 'blurkit-wasm-codecs')

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    git: {
      ref: process.env.GITHUB_REF || 'local',
      sha: process.env.GITHUB_SHA || run('git', ['rev-parse', 'HEAD']).trim(),
      eventName: process.env.GITHUB_EVENT_NAME || 'local',
    },
    packages: [
      collectPackageReport(blurkitDir, 'blurkit'),
      collectPackageReport(codecsDir, 'blurkit-wasm-codecs'),
    ],
  }

  const jsonPath = path.join(artifactsDir, 'library-size-report.json')
  const mdPath = path.join(artifactsDir, 'library-size-report.md')

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(mdPath, renderMarkdown(report), 'utf8')

  process.stdout.write(`${jsonPath}\n${mdPath}\n`)
}

main()
