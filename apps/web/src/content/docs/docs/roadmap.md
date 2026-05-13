---
title: Roadmap
description: Planned direction for features intentionally not shipped today.
---

## When to use

Use this page when evaluating future capabilities or deciding whether to build custom adapters now.

## Example

```text
Need persistent cache now? Implement your own adapter against BlurKitCache.
```

## Inputs / Options / Behavior

Planned, not shipped:

- persistent cache adapters beyond in-memory helper
- broader edge decode coverage
- framework-specific convenience adapters
- additional manifest output targets

Rule of interpretation:

- if it is not in exports, runtime entrypoints, CLI behavior, or examples, treat it as not shipped

## Limits / Caveats

- Roadmap items have no stability guarantees until shipped.
- Production decisions should use documented current behavior only.

## Next read

- [Limits and Caveats](/docs/limits/)
- [Decision: Cache Interface](/docs/decisions/cache-interface/)
- [API: Cache](/docs/api/cache/)
