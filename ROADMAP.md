# Roadmap (internal)

Guardrails to keep scope simple:

1. Keep a strict product boundary: `input -> placeholder result` only.
2. Prioritize runtime reliability and perf over new features.
3. Treat framework adapters as thin wrappers, not full integrations.
4. Add manifest targets only when repeated user demand is proven.
5. Enforce "one in, one out" for new APIs: avoid parallel ways to do the same thing.
6. Keep "Not planned" explicit to prevent drift.

## Not planned

- Server-side rendering integrations (Next.js Image, SvelteKit image, etc.)
- CDN-specific image transformation pipelines
- Full image processing (resize, crop, format conversion beyond placeholder output)
- Framework-specific component wrappers (React, Vue, Svelte placeholder components)
- Placeholder animation or progressive enhancement logic
- Preset collections or curated hash libraries
