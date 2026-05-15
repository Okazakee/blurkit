#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function parseStableVersion(tag) {
  const normalized = tag.startsWith('v') ? tag.slice(1) : tag
  if (!/^\d+\.\d+\.\d+$/.test(normalized)) {
    return null
  }

  const [major, minor, patch] = normalized.split('.').map((value) => Number.parseInt(value, 10))
  return { raw: tag, normalized, major, minor, patch }
}

function compareVersionsDescending(left, right) {
  if (left.major !== right.major) return right.major - left.major
  if (left.minor !== right.minor) return right.minor - left.minor
  return right.patch - left.patch
}

function compareVersionsAscending(left, right) {
  if (left.major !== right.major) return left.major - right.major
  if (left.minor !== right.minor) return left.minor - right.minor
  return left.patch - right.patch
}

function detectPreviousStableTag(currentTag, explicitPreviousTag) {
  if (explicitPreviousTag) {
    return explicitPreviousTag
  }

  const parsedCurrent = parseStableVersion(currentTag)
  if (!parsedCurrent) {
    return ''
  }

  const allTags = runGit(['tag', '--list'])
    .split('\n')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const candidates = allTags
    .map((tag) => parseStableVersion(tag))
    .filter((tag) => tag && compareVersionsAscending(tag, parsedCurrent) < 0)

  if (candidates.length === 0) {
    return ''
  }

  candidates.sort(compareVersionsDescending)
  return candidates[0].raw
}

function parseConventionalCommit(subject) {
  const match = /^(?<type>[a-z]+)(\((?<scope>[^)]+)\))?(?<bang>!)?:\s(?<description>.+)$/.exec(subject)
  if (!match?.groups) {
    return null
  }

  return {
    type: match.groups.type.toLowerCase(),
    scope: match.groups.scope,
    description: match.groups.description,
    breaking: Boolean(match.groups.bang),
  }
}

function hasBreakingBody(body) {
  return /BREAKING CHANGES?:/im.test(body)
}

function readCommits(range, commitPaths) {
  const format = '%H%x1f%s%x1f%b%x1e'
  const args = ['log', '--no-merges', `--pretty=format:${format}`, range, '--', ...commitPaths]
  const log = runGit(args)
  if (!log) {
    return []
  }

  return log
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash = '', subject = '', body = ''] = record.split('\x1f')
      return { hash, subject, body }
    })
}

function renderSection(title, rows) {
  if (rows.length === 0) {
    return ''
  }

  const body = rows.map((row) => `- ${row}`).join('\n')
  return `### ${title}\n${body}`
}

function main() {
  const outputPath = process.argv[2] || 'release-notes.md'
  const currentTag = process.env.CURRENT_TAG || process.env.GITHUB_REF_NAME || ''
  const packageVersion = process.env.PACKAGE_VERSION || (currentTag.startsWith('v') ? currentTag.slice(1) : currentTag)
  const commitPaths = (process.env.COMMIT_PATHS || process.env.COMMIT_PATH || 'packages/blurkit')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  const explicitPreviousTag = process.env.PREVIOUS_TAG || ''
  const repoUrl =
    process.env.REPO_URL ||
    (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`
      : '')

  if (!currentTag) {
    throw new Error('Missing CURRENT_TAG/GITHUB_REF_NAME for release note generation.')
  }

  const previousTag = detectPreviousStableTag(currentTag, explicitPreviousTag)
  const range = previousTag ? `${previousTag}..${currentTag}` : currentTag

  const commits = readCommits(range, commitPaths)
  const breaking = []
  const features = []
  const fixes = []
  const performance = []
  const refactors = []

  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.subject)
    const breakingChange = (parsed?.breaking ?? false) || hasBreakingBody(commit.body)
    const shortHash = commit.hash.slice(0, 7)
    const link = repoUrl ? `[${shortHash}](${repoUrl}/commit/${commit.hash})` : shortHash
    const scope = parsed?.scope?.toLowerCase() ?? ''
    const isNonLibScope = scope === 'website' || scope === 'web' || scope === 'docs'

    if (breakingChange) {
      const description = parsed?.description ?? commit.subject
      breaking.push(`${description} (${link})`)
      continue
    }

    if (!parsed) {
      continue
    }

    if (isNonLibScope) {
      continue
    }

    const row = `${parsed.description} (${link})`

    if (parsed.type === 'feat') {
      features.push(row)
    } else if (parsed.type === 'fix') {
      fixes.push(row)
    } else if (parsed.type === 'perf') {
      performance.push(row)
    } else if (parsed.type === 'refactor') {
      refactors.push(row)
    }
  }

  const header = [`## blurkit ${packageVersion}`]
  if (previousTag) {
    header.push(`_Changes since ${previousTag}_`)
  }

  const sections = [
    renderSection('Breaking Changes', breaking),
    renderSection('Features', features),
    renderSection('Fixes', fixes),
    renderSection('Performance', performance),
    renderSection('Refactors', refactors),
  ].filter(Boolean)

  if (sections.length === 0) {
    sections.push('### Notes\n- No product-impacting changes detected in `packages/blurkit` or `packages/blurkit-wasm-codecs` for this release.')
  }

  const markdown = `${header.join('\n\n')}\n\n${sections.join('\n\n')}\n`
  writeFileSync(outputPath, markdown, 'utf8')
}

main()
