'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight, X } from 'lucide-react'
import type { BackofficeNavGroup, BackofficeNavItem } from '../models/nav'
import { cn } from '../lib/cn'

interface SidebarProps {
  appName: string
  items?: BackofficeNavItem[]
  groups?: BackofficeNavGroup[]
  pathname: string
  collapsed?: boolean
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  footer?: ReactNode
}

function isActivePath(pathname: string, item: BackofficeNavItem): boolean {
  return (
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`) ||
    !!item.items?.some((child) => isActivePath(pathname, child))
  )
}

function NavLink({
  item,
  pathname,
  collapsed,
  nested = false,
  onNavigate,
}: {
  item: BackofficeNavItem
  pathname: string
  collapsed: boolean
  nested?: boolean
  onNavigate?: () => void
}) {
  const active = isActivePath(pathname, item)
  const hasChildren = !!item.items?.length

  return (
    <div>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        onClick={onNavigate}
        className={cn(
          'group flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
          collapsed && !nested && 'justify-center px-2',
          nested && 'h-8 pl-9 text-[13px]'
        )}
      >
        {item.icon ? (
          <span className={cn('grid size-4 shrink-0 place-items-center', active && 'text-primary')}>
            {item.icon}
          </span>
        ) : null}
        <span className={cn('truncate', collapsed && !nested && 'sr-only')}>{item.label}</span>
        {item.badge && !collapsed ? (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {item.badge}
          </span>
        ) : null}
        {hasChildren && !collapsed ? (
          <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
        ) : null}
      </Link>
      {hasChildren && !collapsed ? (
        <div className="mt-1 space-y-1">
          {item.items?.map((child) => (
            <NavLink
              key={child.href}
              item={child}
              pathname={pathname}
              collapsed={false}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SidebarContent({
  appName,
  groups,
  pathname,
  collapsed,
  footer,
  onNavigate,
}: {
  appName: string
  groups: BackofficeNavGroup[]
  pathname: string
  collapsed: boolean
  footer?: ReactNode
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center px-2')}>
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            MS
          </span>
          <span className={cn('truncate text-sm font-semibold text-sidebar-foreground', collapsed && 'sr-only')}>
            {appName}
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div className="space-y-5">
          {groups.map((group, index) => (
            <div key={group.label ?? `group-${index}`} className="space-y-1">
              {group.label && !collapsed ? (
                <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {footer ? (
        <div className={cn('border-t border-sidebar-border p-3', collapsed && 'px-2')}>{footer}</div>
      ) : null}
    </div>
  )
}

export function Sidebar({
  appName,
  items = [],
  groups,
  pathname,
  collapsed = false,
  mobileOpen = false,
  onMobileOpenChange,
  footer,
}: SidebarProps) {
  const navGroups = groups ?? [{ items }]

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear md:block',
          collapsed ? 'w-20' : 'w-72'
        )}
      >
        <SidebarContent
          appName={appName}
          groups={navGroups}
          pathname={pathname}
          collapsed={collapsed}
          footer={footer}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="关闭导航遮罩"
            className="absolute inset-0 bg-foreground/35"
            onClick={() => onMobileOpenChange?.(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[18rem] max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl">
            <button
              type="button"
              aria-label="关闭导航"
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => onMobileOpenChange?.(false)}
            >
              <X className="size-4" />
            </button>
            <SidebarContent
              appName={appName}
              groups={navGroups}
              pathname={pathname}
              collapsed={false}
              footer={footer}
              onNavigate={() => onMobileOpenChange?.(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  )
}
