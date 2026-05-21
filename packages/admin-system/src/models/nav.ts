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
