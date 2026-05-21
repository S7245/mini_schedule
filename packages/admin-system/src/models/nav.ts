import type { ReactNode } from 'react'

export interface BackofficeNavItem {
  href: string
  label: string
  icon?: ReactNode
  badge?: string
  items?: BackofficeNavItem[]
}

export interface BackofficeNavGroup {
  label?: string
  items: BackofficeNavItem[]
}

function pathMatchesNavItem(
  pathname: string,
  item: BackofficeNavItem,
): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function flattenNavItems(items: BackofficeNavItem[]): BackofficeNavItem[] {
  return items.flatMap((item) => [item, ...flattenNavItems(item.items ?? [])])
}

export function findBackofficeNavItem(
  pathname: string,
  navItems: BackofficeNavItem[],
): BackofficeNavItem | undefined {
  return flattenNavItems(navItems)
    .filter((item) => pathMatchesNavItem(pathname, item))
    .sort((a, b) => b.href.length - a.href.length)[0]
}

export function isBackofficeNavItemActive(
  pathname: string,
  item: BackofficeNavItem,
): boolean {
  return (
    pathMatchesNavItem(pathname, item) ||
    !!item.items?.some((child) => isBackofficeNavItemActive(pathname, child))
  )
}

export function getBackofficePageLabel(
  pathname: string,
  navItems: BackofficeNavItem[],
  fallbackLabel: string,
): string {
  return findBackofficeNavItem(pathname, navItems)?.label ?? fallbackLabel
}

export function getBackofficeBreadcrumbs(
  pathname: string,
  navItems: BackofficeNavItem[],
  fallbackLabel: string,
  rootLabel = '后台',
): string[] {
  return [rootLabel, getBackofficePageLabel(pathname, navItems, fallbackLabel)]
}
