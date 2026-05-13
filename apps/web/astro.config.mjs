import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://blurkit.okazakee.dev',
  base: '/',
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: true,
  },
  vite: {
    build: {
      sourcemap: true,
    },
  },
  integrations: [
    react(),
    sitemap(),
    starlight({
      title: 'blurkit',
      description: 'Production-ready placeholder generation for Node, browser, and edge runtimes.',
      logo: {
        src: './src/assets/blurkit-mark.svg',
        alt: 'blurkit',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/okazakee/blurkit',
        },
        {
          icon: 'npm',
          label: 'npm',
          href: 'https://www.npmjs.com/package/blurkit',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/okazakee/blurkit/edit/main/apps/web/src/content/docs/',
      },
      lastUpdated: true,
      pagination: true,
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 3,
      },
      expressiveCode: {
        themes: ['github-dark', 'github-light'],
        styleOverrides: {
          borderRadius: '1.1rem',
          borderWidth: '1px',
          borderColor: 'rgba(103, 236, 255, 0.12)',
          codeFontFamily: "var(--sl-font-mono)",
          codeFontSize: '0.86rem',
          codeLineHeight: '1.55',
          codePaddingBlock: '0.95rem',
          codePaddingInline: '1rem',
          frames: {
            shadowColor: 'transparent',
          },
        },
      },
      components: {
        PageFrame: './src/components/starlight/DocsPageFrame.astro',
        Header: './src/components/starlight/DocsHeader.astro',
        Sidebar: './src/components/starlight/DocsSidebar.astro',
        MobileMenuFooter: './src/components/starlight/DocsMobileMenuFooter.astro',
        TwoColumnContent: './src/components/starlight/DocsTwoColumnContent.astro',
        PageSidebar: './src/components/starlight/DocsPageSidebar.astro',
        ContentPanel: './src/components/starlight/DocsContentPanel.astro',
        PageTitle: './src/components/starlight/DocsPageTitle.astro',
        Footer: './src/components/starlight/DocsFooter.astro',
        Search: './src/components/starlight/DocsSearch.astro',
        MobileMenuToggle: './src/components/starlight/DocsMobileMenuToggle.astro',
        MobileTableOfContents: './src/components/starlight/DocsMobileTableOfContents.astro',
      },
      favicon: '/favicon.svg',
      disable404Route: true,
      head: [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0b0a16' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossorigin: true,
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href:
              'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700;800&display=swap',
          },
        },
      ],
      sidebar: [
        {
          label: 'Overview',
          items: [
            { label: 'Overview', slug: 'docs' },
            { label: 'Installation', slug: 'docs/installation' },
            { label: 'Quick Start', slug: 'docs/quick-start' },
          ],
        },
        {
          label: 'Runtime Guides',
          items: [
            { label: 'Node Runtime', slug: 'docs/runtimes/node' },
            { label: 'Browser Runtime', slug: 'docs/runtimes/browser' },
            { label: 'Edge Runtime', slug: 'docs/runtimes/edge' },
          ],
        },
        {
          label: 'CLI',
          items: [
            { label: 'CLI Overview', slug: 'docs/cli' },
            { label: 'Single Image', slug: 'docs/cli/single-image' },
            { label: 'Manifest Generation', slug: 'docs/cli/manifest-generation' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'API: encode()', slug: 'docs/api/encode' },
            { label: 'API: encodeMany()', slug: 'docs/api/encode-many' },
            { label: 'API: Options', slug: 'docs/api/options' },
            { label: 'API: Result', slug: 'docs/api/result' },
            { label: 'API: Manifest Helpers', slug: 'docs/api/manifest' },
            { label: 'API: Cache', slug: 'docs/api/cache' },
          ],
        },
        {
          label: 'Use Cases',
          items: [
            { label: 'Guide: Next.js', slug: 'docs/guides/nextjs' },
            { label: 'Guide: Build-time Manifests', slug: 'docs/guides/build-time-manifest-generation' },
            { label: 'Guide: Browser Uploader Flow', slug: 'docs/guides/browser-uploader-flow' },
            { label: 'Guide: CMS Import Pipeline', slug: 'docs/guides/cms-import-pipeline' },
          ],
        },
        {
          label: 'Decisions and Limits',
          items: [
            { label: 'Limits and Caveats', slug: 'docs/limits' },
            { label: 'Decision: Cache Interface', slug: 'docs/decisions/cache-interface' },
            { label: 'Roadmap', slug: 'docs/roadmap' },
          ],
        },
      ],
      customCss: ['./src/styles/shared.css', './src/styles/docs.css'],
    }),
  ],
})
