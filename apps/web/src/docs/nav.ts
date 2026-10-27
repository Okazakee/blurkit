export interface NavItem {
  label: string
  slug: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface DocsPager {
  prev?: NavItem
  next?: NavItem
}

export function hrefFor(slug: string): string {
  if (slug === 'docs') return '/docs/'
  return `/docs/${slug.replace(/^docs\//, '')}/`
}

export function flattenNav(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) => group.items)
}

export function groupFor(groups: NavGroup[], slug: string): NavGroup | undefined {
  return groups.find((group) => group.items.some((item) => item.slug === slug))
}

export function pagerFor(groups: NavGroup[], slug: string): DocsPager {
  const items = flattenNav(groups)
  const index = items.findIndex((item) => item.slug === slug)

  if (index === -1) {
    return {}
  }

  return {
    prev: index > 0 ? items[index - 1] : undefined,
    next: index < items.length - 1 ? items[index + 1] : undefined,
  }
}
