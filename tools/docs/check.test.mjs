import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, describe, it } from 'node:test'

import { checkDocs, extractLinks, slugify, stripCode } from './check.mjs'

const fixtures = []

function createFixture(pages, { config, readme = '[docs](./apps/web/src/content/docs/docs/index.md)\n' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'blurkit-docs-'))
  fixtures.push(root)

  const docsRoot = join(root, 'apps/web/src/content/docs/docs')
  const sidebar = config ?? Object.keys(pages).map((slug) => `        { label: 'Page', slug: '${slug}' },`).join('\n')

  mkdirSync(docsRoot, { recursive: true })
  mkdirSync(join(root, 'apps/web/public'), { recursive: true })
  writeFileSync(
    join(root, 'apps/web/astro.config.mjs'),
    `export default {\n  sidebar: [\n${sidebar}\n  ],\n}\n`,
  )
  writeFileSync(join(root, 'README.md'), readme)

  for (const [slug, content] of Object.entries(pages)) {
    const relative = slug === 'docs' ? 'index.md' : `${slug.replace(/^docs\//, '')}.md`
    const file = join(docsRoot, relative)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content)
  }

  return root
}

after(() => {
  for (const root of fixtures) rmSync(root, { recursive: true, force: true })
})

describe('slugify', () => {
  it('normalises headings the way Starlight does', () => {
    assert.equal(slugify('Cloudflare hash semantics'), 'cloudflare-hash-semantics')
    assert.equal(slugify('`encode()` and `encodeMany()`'), 'encode-and-encodemany')
    assert.equal(slugify('What came back?'), 'what-came-back')
  })
})

describe('extractLinks', () => {
  it('finds markdown links and angle-bracket autolinks', () => {
    const links = extractLinks('[a](/docs/installation/) and <https://blurkit.okazakee.dev/docs/>\n')
    assert.deepEqual(links, ['/docs/installation/', 'https://blurkit.okazakee.dev/docs/'])
  })

  it('ignores links inside fenced and inline code', () => {
    const text = ['```md', '[b](/docs/nope/)', '```', 'Use `[c](/docs/nope/)` as an example.', '[d](/docs/ok/)'].join('\n')
    assert.deepEqual(extractLinks(text), ['/docs/ok/'])
  })
})

describe('stripCode', () => {
  it('removes fenced content but keeps surrounding markdown', () => {
    const text = 'before\n```ts\nconst x = 1\n```\nafter'
    assert.equal(stripCode(text), 'before\n\n\n\nafter')
  })
})

describe('checkDocs', () => {
  it('accepts a consistent fixture', () => {
    const root = createFixture({
      docs: '# Docs\n\n[install](/docs/installation/)\n',
      'docs/installation': '# Installation\n\n## Runtime matrix\n\n[docs](/docs/)\n',
    })

    assert.deepEqual(checkDocs({ root }).errors, [])
  })

  it('fails when a page is missing from the sidebar', () => {
    const root = createFixture(
      {
        docs: '# Docs\n',
        'docs/installation': '# Installation\n',
      },
      { config: "        { label: 'Docs', slug: 'docs' }," },
    )

    assert.match(checkDocs({ root }).errors.join('\n'), /docs\/installation: page is not linked/)
  })

  it('allows an explicit sidebar exemption', () => {
    const root = createFixture(
      {
        docs: '# Docs\n',
        'docs/installation': '# Installation\n',
      },
      { config: "        { label: 'Docs', slug: 'docs' }," },
    )

    const result = checkDocs({ root, sidebarExempt: new Set(['docs/installation']) })
    assert.deepEqual(result.errors, [])
  })

  it('reports duplicate and unknown sidebar slugs', () => {
    const root = createFixture(
      { docs: '# Docs\n' },
      { config: "        { label: 'Docs', slug: 'docs' },\n        { label: 'Docs again', slug: 'docs' },\n        { label: 'Ghost', slug: 'docs/missing' }," },
    )

    const errors = checkDocs({ root }).errors.join('\n')
    assert.match(errors, /duplicate sidebar slug 'docs'/)
    assert.match(errors, /sidebar slug 'docs\/missing' has no page/)
  })

  it('reports broken routes and anchors', () => {
    const root = createFixture({
      docs: '# Docs\n\n[route](/docs/nope/)\n[anchor](/docs/installation/#nope)\n[in-page](#missing)\n',
      'docs/installation': '# Installation\n\n## Runtime matrix\n',
    })

    const errors = checkDocs({ root }).errors.join('\n')
    assert.match(errors, /broken internal link \/docs\/nope\//)
    assert.match(errors, /broken anchor \/docs\/installation\/#nope/)
    assert.match(errors, /missing heading anchor #missing/)
  })

  it('reports broken site-origin autolinks', () => {
    const root = createFixture(
      { docs: '# Docs\n\n<https://blurkit.okazakee.dev/docs/nope/>\n' },
      { readme: '<https://blurkit.okazakee.dev/docs/nope/>\n' },
    )

    assert.match(checkDocs({ root }).errors.join('\n'), /broken internal link \/docs\/nope\//)
  })

  it('ignores links inside fences', () => {
    const root = createFixture({ docs: '# Docs\n\n```md\n[bad](/docs/nope/)\n```\n' })
    assert.deepEqual(checkDocs({ root }).errors, [])
  })

  it('requires a language on every fence and catches unclosed fences', () => {
    const root = createFixture({ docs: '# Docs\n\n```\nnpx blurkit encode a.jpg\n```\n' })
    assert.match(checkDocs({ root }).errors.join('\n'), /code fence without a language/)

    const unclosed = createFixture({ docs: '# Docs\n\n```bash\nnpx blurkit encode a.jpg\n' })
    assert.match(checkDocs({ root: unclosed }).errors.join('\n'), /unclosed code fence/)
  })
})
