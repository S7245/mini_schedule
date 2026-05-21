'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { ChevronDown, LogOut, Menu, PanelLeft, Search, UserCircle } from 'lucide-react'
import { cn } from '../lib/cn'

interface TopbarProps {
  title: string
  actions?: ReactNode
  breadcrumbs?: string[]
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  onOpenMobileSidebar?: () => void
  searchPlaceholder?: string
  userLabel?: string
  userDescription?: string
  logoutLabel?: string
  logoutPending?: boolean
  onLogout?: () => void
}

export function Topbar({
  title,
  actions,
  breadcrumbs,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
  searchPlaceholder = '搜索',
  userLabel = '管理员',
  userDescription,
  logoutLabel = '退出登录',
  logoutPending = false,
  onLogout,
}: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="打开导航"
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
            onClick={onOpenMobileSidebar}
          >
            <Menu className="size-4" />
          </button>
          <button
            type="button"
            aria-label={sidebarCollapsed ? '展开导航' : '折叠导航'}
            className="hidden size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground md:grid"
            onClick={onToggleSidebar}
          >
            <PanelLeft className={cn('size-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
          </button>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <div className="min-w-0">
            {breadcrumbs?.length ? (
              <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                {breadcrumbs.map((crumb, index) => (
                  <span key={`${crumb}-${index}`} className="flex items-center gap-1">
                    {index > 0 ? <span>/</span> : null}
                    <span className={index === breadcrumbs.length - 1 ? 'text-foreground' : undefined}>
                      {crumb}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
            <p className="truncate text-sm font-medium text-foreground sm:hidden">{title}</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <div className="relative hidden w-[min(24vw,18rem)] min-w-44 md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          {actions}
          <div className="relative">
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2 text-sm shadow-sm transition hover:bg-accent"
              onClick={() => setUserMenuOpen((open) => !open)}
            >
              <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
                <UserCircle className="size-4" />
              </span>
              <span className="hidden max-w-28 truncate font-medium sm:inline">{userLabel}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
            {userMenuOpen ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium">{userLabel}</p>
                  {userDescription ? (
                    <p className="truncate text-xs text-muted-foreground">{userDescription}</p>
                  ) : null}
                </div>
                {onLogout ? (
                  <button
                    type="button"
                    disabled={logoutPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onLogout()
                    }}
                  >
                    <LogOut className="size-4" />
                    {logoutPending ? '退出中...' : logoutLabel}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
