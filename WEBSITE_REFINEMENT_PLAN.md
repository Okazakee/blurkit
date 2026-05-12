# blurkit Website — Full UX/UI Production Refinement Plan

> **Scope:** Every file in `apps/web/src/`, config, styles, components, content, and build setup.
> **Goal:** Ship a production-grade site with zero visual inconsistencies, full accessibility compliance, optimal performance, and polished interaction design.

---

## 1. Meta, SEO & Accessibility

### 1.1 Homepage (`index.astro`)
- Add a descriptive `<meta name="description">`.
- Add Open Graph tags: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`.
- Add Twitter Card tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- Add `<link rel="canonical" href="..." />`.
- Add `<meta name="theme-color" content="#0b0a16" />`.
- Add a favicon link (generate a simple `favicon.ico` and `apple-touch-icon.png` or use an SVG mark).
- Add structured data via JSON-LD (`SoftwareApplication` or `WebSite` schema).
- Add a "Skip to main content" link as the first focusable element.
- Change `<title>` to something descriptive: `blurkit — Universal Placeholder Generation`.

### 1.2 Docs Pages (Starlight)
- Configure `astro.config.mjs` Starlight options:
  - `editLink.baseUrl` pointing to the GitHub repo edit path.
  - `lastUpdated: true`.
  - `pagination: true`.
  - `tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 }`.
  - ` expressiveCode: { themes: ['github-dark', 'github-light'] }` (or similar dark-only theming).
- Add social links in Starlight config (`social.github`, `social.npm` if available).
- Ensure every docs page has a unique and accurate `description` frontmatter field.

### 1.3 Accessibility (Global)
- Apply `aria-label` to the `<nav class="site-nav">` on the homepage.
- Ensure all interactive elements in `BlurDemo.tsx` have visible focus indicators.
- Add `prefers-reduced-motion` media query that disables:
  - `scroll-behavior: smooth`
  - Button hover transforms
  - Gradient animations (if any are added later)
- Ensure color contrast meets WCAG AA for all text/background pairs. Specifically verify:
  - `.site-brand-mark` text (`#070711` on bright gradient).
  - `.bk-demo-status--ready` text (`#cbbcff` on translucent background).
  - `.site-eyebrow` text.

---

## 2. Layout, Typography & Visual System

### 2.1 CSS Architecture Refactor
**File: `site.css`**
- Add a global CSS reset / normalize block at the top:
  - `*, *::before, *::after { box-sizing: border-box; margin: 0; }`
  - `html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }`
  - `body { line-height: 1.5; }`
  - `img, picture, video, canvas, svg { display: block; max-width: 100%; }`
  - `input, button, textarea, select { font: inherit; }`
- Add `::selection` styles with the accent color (`#8e6cff`) background and white text.
- Add `color-scheme: dark` to `:root`.
- Replace deprecated `word-break: break-word` in `.site-code` and `.bk-demo pre` with `overflow-wrap: anywhere`.
- Add `text-wrap: balance` to all headings (`h1`, `h2`, `h3`) and `text-wrap: pretty` to paragraphs.
- Define a consistent spacing scale as CSS custom properties (e.g., `--bk-space-1` through `--bk-space-8`) and refactor existing margin/padding values to use it.
- Remove the duplicate `body` background definition from `site.css` and let `custom.css` own the Starlight-specific background.

**File: `custom.css`**
- Remove the `body` background gradient duplication (it exists in both `custom.css` and `site.css`). `custom.css` should only contain Starlight-specific overrides; `site.css` should contain the homepage styles.
- Ensure `:root[data-theme='light']` variables are defined if light mode is ever supported, or explicitly scope everything to dark mode only.
- Add `@supports` fallback for `backdrop-filter: blur()` where used.

### 2.2 Homepage Layout Fixes
- **Hero title wrapping:** `.site-title` has `max-width: 10ch` which aggressively breaks the long title. Remove or increase this limit, or manually insert `<br>` at semantic breakpoints.
- **Responsive breakpoints:** Add an intermediate tablet breakpoint (e.g., `@media (max-width: 1100px)`) to refine the hero grid before the 900px mobile breakpoint.
- **Footer:** Add a `<footer>` to the homepage. It is completely missing. Include:
  - Copyright / license notice.
  - Links to GitHub, npm.
  - A link back to docs.
  - Styled consistently with the site cards but slightly more subdued.
- **Main container padding:** The bottom padding of `site-main` (`5rem`) is fine with a footer, but ensure the footer does not awkwardly float. Consider making the footer `margin-top: auto` inside `site-shell` so the page feels grounded.
- **Ultrawide screens:** Radial gradients use fixed percentages. Test on 3440px+ widths. If gradients look too sparse, add `background-size` or additional gradient stops.

### 2.3 Typography
- Ensure `line-height` is explicitly set on `body` (currently missing).
- Add `-webkit-font-smoothing: antialiased` globally.
- Ensure `font-family` fallback stack is robust. `Space Grotesk` should be loaded via `@font-face` or Google Fonts link in `index.astro`. Currently, it is referenced in CSS but never loaded — the site falls back to system sans-serif.
- Same for `IBM Plex Mono` — referenced but never loaded.

---

## 3. BlurDemo Component (`BlurDemo.tsx`)

### 3.1 Functional Improvements
- **Add drag-and-drop zone:** Wrap the file input in a visually prominent drop zone with dashed borders, hover state, and `dragover`/`dragleave`/`drop` handlers.
- **Styled file input:** Hide the default file input and trigger it from a styled button inside the drop zone.
- **File validation:** Reject non-image files with a clear inline error message.
- **Reset button:** Add a button to clear the current file and reset all state.
- **Sample images:** Provide 2–3 small sample images (e.g., a landscape, a portrait, an icon) that users can click to try the demo without uploading.
- **Copy buttons:** Add small "Copy" buttons next to the Hash, Data URL, and Manifest preview blocks.
- **Download button:** Add a "Download placeholder" button for the generated `dataURL`.
- **Performance:** Wrap `manifestPreview` in `useMemo` so it does not recompute on every render.
- **Keyboard:** Ensure all controls are reachable via Tab. Add `tabIndex` management if needed.
- **Error retry:** If encoding fails, show a "Retry" button that re-runs with the same settings.

### 3.2 Visual Improvements
- **Range inputs:** Add custom CSS styling for `<input type="range">` track and thumb to match the site theme (cyan/purple accent).
- **Select dropdowns:** Style `<select>` elements with a custom arrow icon and theme-matched dropdown appearance.
- **Disabled states:** When `algorithm !== 'blurhash'`, the component sliders are disabled but visually look almost identical. Add stronger opacity reduction (`opacity: 0.4`) and a `not-allowed` cursor.
- **Loading state:** Replace plain text "Generating placeholder…" with a subtle pulsing skeleton or spinner inside the placeholder preview card.
- **Tooltips:** Add small `title` attributes or custom tooltips to technical terms like "componentX" and "componentY" explaining what they do.
- **Aspect ratio display:** Show the original image dimensions and the computed placeholder dimensions.
- **Image attributes:** Add `loading="lazy"` and `decoding="async"` to result images. Add explicit `width` and `height` to prevent layout shift if the container size is known.

### 3.3 Accessibility
- Add `aria-live="polite"` to the status bar region so screen readers announce state changes.
- Add `aria-disabled` to disabled controls.
- Ensure error messages are linked to their respective inputs with `aria-describedby`.

---

## 4. Documentation Content & Structure

### 4.1 Content Quality
- **Cache interface decision page:** `cache-interface.md` is only 10 lines. Expand it to explain the design rationale, trade-offs considered, and why persistent adapters were deferred.
- **Add callout components:** Use Starlight's `:::note`, `:::caution`, `:::danger` syntax (or equivalent) instead of plain text for caveats and warnings.
- **Code blocks:** Add file names to code blocks where applicable (Starlight supports ` ```ts title="..." `).
- **Next.js guide:** The example code has `alt=""`. Add a meaningful alt text or explain why it's empty in this context.
- **Missing pages:** The `api/` and `decisions/` directories at the top level of `content/docs/` are empty. Remove them if unused, or add redirect/placeholder content.

### 4.2 Visual Polish in Docs
- **Installation table:** The markdown table is fine but could be visually enhanced with the site's card styling. Consider wrapping it or adding custom CSS for table cells.
- **Consistent heading structure:** Ensure every docs page starts with an `h1` (already mostly true) and follows a logical outline without skipping levels.
- **Add diagrams:** For the runtime comparison (Node vs Browser vs Edge), create a simple ASCII or SVG diagram showing which inputs each runtime accepts.

---

## 5. Performance & Production

### 5.1 Fonts
- Add Google Fonts (or self-hosted `@font-face`) preconnect and stylesheet links in `index.astro` `<head>`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700;800&display=swap" rel="stylesheet">
  ```
- Use `font-display: swap` for any `@font-face` declarations.

### 5.2 Build & SEO
- Generate a `robots.txt` in `public/robots.txt`.
- Generate a `sitemap.xml` via `@astrojs/sitemap` integration.
- Add `@astrojs/partytown` for any third-party scripts (analytics, etc.) if added later.
- Configure a custom `404.astro` page that matches the site branding.

### 5.3 Astro Configuration
- `astro.config.mjs`:
  - Add `site: 'https://blurkit.dev'` (or actual domain).
  - Add `base: '/'` explicitly.
  - Add `trailingSlash: 'always'` or `'never'` consistently.
  - Add `prefetch: { prefetchAll: true }` for instant page transitions.
  - Add `vite.build.sourcemap: true` for debugging, then disable for production if desired.

### 5.4 Code Splitting
- The `BlurDemo` component imports `blurkit/browser` which is likely non-trivial. Ensure the component is only hydrated where needed (`client:load` is already used, which is good). Verify that the browser bundle does not accidentally pull in Node-specific code.

---

## 6. Interaction & Motion

### 6.1 Hover & Active States
- **Buttons:** `.site-button--ghost` needs a hover background change, not just a 1px lift. Add `background: rgba(255, 255, 255, 0.09)` on hover.
- **Cards:** `.site-card` and `.bk-demo-card` should have a subtle hover lift (`transform: translateY(-2px)`) and increased shadow.
- **Active states:** Add `:active` styles to buttons (slight scale down: `transform: scale(0.98)`).

### 6.2 Focus Management
- Add explicit `:focus-visible` styles globally:
  ```css
  :focus-visible {
    outline: 2px solid var(--bk-accent-cool);
    outline-offset: 2px;
  }
  ```
- Remove default `outline: none` unless replaced by a custom focus style. Currently, `.bk-demo-card input:focus` removes outline but adds a box-shadow — this is acceptable but ensure it is consistent across all inputs.

### 6.3 Animations
- Add a subtle fade-in animation for the hero section on page load (`opacity: 0 -> 1`, `translateY(10px) -> 0`).
- Stagger the "What ships today" cards so they appear sequentially.
- Keep animations under 300ms and respect `prefers-reduced-motion`.

---

## 7. Mobile & Touch

- **Safe areas:** Add `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` to `site-main` or `site-shell` for notched devices.
- **Tap targets:** Ensure all buttons and interactive elements are at least `44px` tall/wide. The `.site-button` is fine, but `.bk-demo-card input[type='range']` may need extra padding on mobile.
- **Viewport:** Add `maximum-scale=1` is generally discouraged for accessibility. Keep the current viewport meta but do not restrict zoom.
- **Demo grid on mobile:** At very small widths (`< 360px`), `minmax(220px, 1fr)` forces single column, which is correct, but the `gap` might feel too large. Reduce `gap` to `0.85rem` below 400px.
- **Hero title on small screens:** `clamp(3rem, 11vw, 6rem)` can result in `~3rem` on small screens. Ensure line-height stays comfortable and words don't break awkwardly.

---

## 8. Starlight Docs Theme Polish

- **Logo:** Add a `logo` config to Starlight with the same "bk" mark SVG used on the homepage.
- **Custom 404:** Create `src/pages/404.astro` or configure Starlight's 404 to use the site styling.
- **Search:** PageFind is already included. Verify the search UI colors match the custom palette. If not, override PageFind CSS variables in `custom.css`.
- **Sidebar active item:** The current active item may not be visually distinct enough. Add custom CSS to highlight it with the accent color background or left border.
- **Breadcrumbs:** Enable if Starlight version supports it; otherwise, verify manual breadcrumb links are present.

---

## 9. Content Config & Types

- **File: `content.config.ts`**
  - The `Collections` type is manually defined but `astro:content` can infer this. Simplify to:
    ```ts
    export const collections = { docs }
    ```
  - Ensure `docsSchema()` is correctly typed for the current Astro version.

---

## 10. Complete File-By-File Checklist

### `astro.config.mjs`
- [ ] Add `site`, `base`, `trailingSlash`, `prefetch`.
- [ ] Configure Starlight `logo`, `social`, `editLink`, `lastUpdated`, `pagination`, `tableOfContents`, ` expressiveCode`.
- [ ] Add `@astrojs/sitemap` integration.

### `package.json`
- [ ] Add `@astrojs/sitemap` to dependencies if not present.
- [ ] Verify `blurkit` workspace dependency resolves correctly in production build.

### `src/pages/index.astro`
- [ ] Add full SEO meta tags, favicon, font links, JSON-LD.
- [ ] Add skip-to-content link.
- [ ] Add `<footer>`.
- [ ] Ensure `lang="en"` and `dir="ltr"` are present.

### `src/components/BlurDemo.tsx`
- [ ] Add drag-and-drop zone.
- [ ] Style file input, selects, and range inputs.
- [ ] Add copy/download buttons for outputs.
- [ ] Add sample images.
- [ ] Add reset button.
- [ ] Wrap `manifestPreview` in `useMemo`.
- [ ] Add `aria-live` region for status.
- [ ] Improve disabled state visuals.
- [ ] Add loading skeleton/spinner.

### `src/styles/site.css`
- [ ] Add CSS reset.
- [ ] Add `::selection`, `color-scheme`, `-webkit-font-smoothing`.
- [ ] Add spacing scale variables.
- [ ] Fix `word-break` to `overflow-wrap`.
- [ ] Add `text-wrap` to headings and paragraphs.
- [ ] Add `:focus-visible` global style.
- [ ] Add `prefers-reduced-motion` block.
- [ ] Add footer styles.
- [ ] Add intermediate responsive breakpoint.
- [ ] Add hover/active states for cards and buttons.
- [ ] Add fade-in animations.

### `src/styles/custom.css`
- [ ] Remove duplicate `body` background.
- [ ] Ensure dark/light variable coverage is complete.
- [ ] Add PageFind search color overrides.
- [ ] Add sidebar active-item highlight.
- [ ] Add `@supports` fallback for `backdrop-filter`.

### `src/content.config.ts`
- [ ] Simplify type annotation.

### Docs Content (all `.md` and `.mdx` files)
- [ ] Ensure every page has `description` frontmatter.
- [ ] Use `:::note`, `:::caution` for caveats.
- [ ] Add code block titles.
- [ ] Expand `cache-interface.md`.
- [ ] Remove empty top-level `api/`, `decisions/`, `guides/`, `runtimes/` directories.
- [ ] Add meaningful `alt` text in Next.js guide.

### New Files to Create
- [ ] `apps/web/public/robots.txt`
- [ ] `apps/web/public/favicon.ico` (or `.svg`)
- [ ] `apps/web/public/apple-touch-icon.png`
- [ ] `apps/web/src/pages/404.astro` (or Starlight custom 404 config)

---

## 11. Verification Steps

Before calling the site production-ready, run through this checklist:

- [ ] **Build succeeds:** `astro build` completes with zero errors and zero unresolved workspace warnings.
- [ ] **Lighthouse 95+:** Homepage scores 95+ on Performance, Accessibility, Best Practices, and SEO.
- [ ] **Docs Lighthouse 95+:** Any docs page scores 95+ on the same metrics.
- [ ] **No visual regressions:** Compare before/after screenshots at 320px, 768px, 1440px, and 2560px widths.
- [ ] **Keyboard navigable:** Tab through the entire homepage and a docs page without getting trapped or losing focus visibility.
- [ ] **Screen reader sanity check:** The demo announces status changes; headings are logical.
- [ ] **Mobile tested:** iOS Safari and Chrome Android render correctly; tap targets are comfortable.
- [ ] **Reduced motion:** Enable `prefers-reduced-motion` and confirm no jarring animations remain.
- [ ] **No console errors:** DevTools console is clean on homepage and docs.
- [ ] **Links work:** Every internal link resolves; no 404s from navigation.

---

*This plan covers every identified surface of the blurkit website. Implement every item before shipping.*
