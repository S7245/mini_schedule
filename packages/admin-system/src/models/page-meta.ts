import type { ReactNode } from 'react'

export interface PageAction {
  key: string
  label: string
  icon?: ReactNode
}

export interface BreadcrumbItem {
  href?: string
  label: string
}
