#!/usr/bin/env node
// Validates documentation links, sidebar coverage, and code fences.
// Dependency-free so it can run in CI before any install-heavy job.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Pages that intentionally stay out of the sidebar. Keep this list short. */
export const DEFAULT_SIDEBAR_EXEMPT = new Set()

/** Starlight/GitHub-style heading slug, good enough for our headings. */
export function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/** Removes fenced blocks and inline code so their contents are never treated as links. */
export function stripCode(text) {
  let inside = false
  const lines = text.split('\n').map((line) => {
    if (line.startsWith('```')) {
      inside = !inside
      return ''
    }
    return inside ? '' : line
  })

  return lines.join('\n').replace(/`[^`\n]*`/g, '')
}

const MARKDOWN_LINK = /\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g
const AUTOLINK = /<((?:https?|mailto):[^>\s]+)>/g

export function extractLinks(text) {
  const source = stripCode(text)
  const links = []

  for (const match of source.matchAll(MARKDOWN_LINK)) links.push(match[1])
  for (const match of source.matchAll(AUTOLINK)) links.push(match[1])

  return links
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

export function checkDocs({ root = DEFAULT_ROOT, sidebarExempt = DEFAULT_SIDEBAR_EXEMPT } = {}) {
  const errors = []
  const warnings = []

  const docsRoot = join(root, 'apps/web/src/content/docs/docs')
  const publicRoot = join(root, 'apps/web/public')
  const configPath = join(root, 'apps/web/astro.config.mjs')

  const fail = (file, message) => {
    errors.push(`${relative(root, file)}: ${message}`)
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
    for (const target of extractLinks(readFileSync(file, 'utf8'))) {
      linkCount += 1
      checkTarget(file, target)
    }
  }

  // Sidebar slugs must be unique, must resolve, and should cover every page.
  const config = readFileSync(configPath, 'utf8')
  const sidebarSlugs = [...config.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1])
  const seenSlugs = new Set()

  for (const slug of sidebarSlugs) {
    if (seenSlugs.has(slug)) {
      errors.push(`astro.config.mjs: duplicate sidebar slug '${slug}'`)
    }
    seenSlugs.add(slug)

    if (!docsBySlug.has(slug)) {
      errors.push(`astro.config.mjs: sidebar slug '${slug}' has no page`)
    }
  }

  for (const slug of docsBySlug.keys()) {
    if (!seenSlugs.has(slug) && !sidebarExempt.has(slug)) {
      errors.push(`${slug}: page is not linked from the sidebar`)
    }
  }

  return { errors, warnings, links: linkCount, pages: docsBySlug.size }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  const { errors, warnings, links, pages } = checkDocs()

  console.log(`Checked ${pages} docs pages and ${links} links.`)
  for (const warning of warnings) console.warn(`warning: ${warning}`)

  if (errors.length > 0) {
    for (const error of errors) console.error(`error: ${error}`)
    console.error(`\n${errors.length} documentation problem(s) found.`)
    process.exit(1)
  }

  console.log('Documentation links and structure are valid.')
}
