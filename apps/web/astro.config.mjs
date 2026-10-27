import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import expressiveCode from 'astro-expressive-code'

const SITE_URL = 'https://blurkit.okazakee.dev'

export default defineConfig({
  site: SITE_URL,
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
    expressiveCode({
      themes: ['github-dark'],
      styleOverrides: {
        borderRadius: '4px',
        borderWidth: '1px',
        borderColor: '#232327',
        codeFontFamily: 'var(--bk-mono)',
        codeFontSize: '0.84rem',
        codeLineHeight: '1.6',
        codePaddingBlock: '1rem',
        codePaddingInline: '1.15rem',
        codeBackground: '#0a0a0c',
        codeForeground: '#cfcac2',
        frames: {
          shadowColor: 'transparent',
          editorActiveTabBackground: '#101012',
          editorTabBarBackground: '#0d0d0f',
          editorTabBarBorderBottomColor: '#232327',
          terminalBackground: '#0a0a0c',
          frameBoxShadowCssValue: 'none',
          editorActiveTabIndicatorTopColor: 'transparent',
          editorActiveTabIndicatorBottomColor: 'transparent',
        },
      },
    }),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/styleguide'),
    }),
  ],
})
