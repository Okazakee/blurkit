#!/usr/bin/env node
// Validates documentation links, sidebar coverage, and code fences.
// Dependency-free so it can run in CI before any install-heavy job.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const docsRoot = join(root, 'apps/web/src/content/docs/docs')
const publicRoot = join(root, 'apps/web/public')
const configPath = join(root, 'apps/web/astro.config.mjs')

const errors = []
const warnings = []

function fail(file, message) {
  errors.push(`${relative(root, file)}: ${message}`)
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

/** Starlight/GitHub-style heading slug, good enough for our headings. */
function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function stripCodeFences(text) {
  let inside = false
  return text
    .split('\n')
    .map((line) => {
      if (line.startsWith('```')) {
        inside = !inside
        return ''
      }
      return inside ? '' : line
    })
    .join('\n')
}

const docsFiles = walk(docsRoot).filter((file) => /\.(md|mdx)$/.test(file))
const docsBySlug = new Map()
const slugByFile = new Map()

for (const file of docsFiles) {
  const relativePath = relative(docsRoot, file).replace(/\.(md|mdx)$/, '')
  const slug = relativePath === 'index' ? 'docs' : `docs/${relativePath.replace(/\/index$/, '')}`
  const text = readFileSync(file, 'utf8')
  const headings = text
    .split('\n')
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => slugify(line.replace(/^#{1,6}\s+/, '')))

  docsBySlug.set(slug, { file, headings, text })
  slugByFile.set(file, slug)
}

// Code fences: every opening fence needs a language.
for (const file of docsFiles) {
  let inside = false
  for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries()) {
    if (!line.startsWith('```')) continue
    if (inside) {
      inside = false
      continue
    }
    inside = true
    if (!line.slice(3).trim()) {
      fail(file, `line ${index + 1}: code fence without a language`)
    }
  }
  if (inside) fail(file, 'unclosed code fence')
}

const linkPattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

function checkTarget(file, rawTarget) {
  if (/^(mailto:|tel:)/i.test(rawTarget)) return

  // Absolute links to the docs site must still resolve as real pages.
  const target = rawTarget.startsWith('https://blurkit.okazakee.dev')
    ? rawTarget.replace('https://blurkit.okazakee.dev', '') || '/'
    : rawTarget

  if (/^https?:/i.test(target)) return

  const [rawPath, anchor] = target.split('#')

  if (target.startsWith('#') || rawPath === '') {
    const doc = docsBySlug.get(slugByFile.get(file))
    if (!doc) {
      fail(file, `in-page anchor #${anchor} in a non-docs file`)
      return
    }
    if (!doc.headings.includes(anchor ?? '')) {
      fail(file, `missing heading anchor #${anchor}`)
    }
    return
  }

  if (rawPath.startsWith('/docs')) {
    const slug = rawPath.replace(/^\/docs\/?/, 'docs/').replace(/\/$/, '') || 'docs'
    const doc = docsBySlug.get(slug)
    if (!doc) {
      fail(file, `broken internal link ${target} (no page for ${slug})`)
      return
    }
    if (anchor && !doc.headings.includes(anchor)) {
      fail(file, `broken anchor ${target} (no heading #${anchor} in ${slug})`)
    }
    return
  }

  if (rawPath.startsWith('/')) {
    const asset = join(publicRoot, rawPath.replace(/^\//, ''))
    if (!existsSync(asset)) {
      fail(file, `missing public asset ${target}`)
    }
    return
  }

  const resolved = resolve(dirname(file), rawPath)
  if (!existsSync(resolved)) {
    fail(file, `missing relative target ${target}`)
  }
}

const markdownFiles = [
  join(root, 'README.md'),
  join(root, 'CONTRIBUTING.md'),
  join(root, 'COMMIT_CONVENTIONS.md'),
  join(root, 'PUBLISHING.md'),
  join(root, 'ROADMAP.md'),
  join(root, 'packages/blurkit/README.md'),
  join(root, 'packages/blurkit-wasm-codecs/README.md'),
  join(root, 'apps/example-nextjs/README.md'),
  join(root, 'apps/example-astro/README.md'),
  ...docsFiles,
].filter((file) => existsSync(file))

let linkCount = 0

for (const file of markdownFiles) {
  const text = stripCodeFences(readFileSync(file, 'utf8'))
  for (const match of text.matchAll(linkPattern)) {
    linkCount += 1
    checkTarget(file, match[1])
  }
}

// Sidebar slugs must resolve, and every docs page should be reachable from it.
const config = readFileSync(configPath, 'utf8')
const sidebarSlugs = [...config.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1])

for (const slug of sidebarSlugs) {
  if (!docsBySlug.has(slug)) {
    errors.push(`astro.config.mjs: sidebar slug '${slug}' has no page`)
  }
}

for (const slug of docsBySlug.keys()) {
  if (!sidebarSlugs.includes(slug)) {
    warnings.push(`${slug}: page is not linked from the sidebar`)
  }
}

console.log(`Checked ${docsBySlug.size} docs pages and ${linkCount} links.`)

for (const warning of warnings) console.warn(`warning: ${warning}`)

if (errors.length > 0) {
  for (const error of errors) console.error(`error: ${error}`)
  console.error(`\n${errors.length} documentation problem(s) found.`)
  process.exit(1)
}

console.log('Documentation links and structure are valid.')
