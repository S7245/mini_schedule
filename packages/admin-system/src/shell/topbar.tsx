'use client'

import type { ReactNode, RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import { LogOut, Menu, PanelLeft, Search } from 'lucide-react'
import { cn } from '../lib/cn'
import { getInitials, type ShellPreferences } from './preferences'

interface TopbarProps {
  title: string
  actions?: ReactNode
  breadcrumbs?: string[]
  sidebarCollapsed?: boolean
  preferences: ShellPreferences
  onToggleSidebar?: () => void
  onOpenMobileSidebar?: () => void
  searchPlaceholder?: string
  userLabel?: string
  userDescription?: string
  logoutLabel?: string
  logoutPending?: boolean
  onLogout?: () => void
}

function useDismissableLayer(open: boolean, onDismiss: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onDismiss()
      }
    }

    if (open) {
      document.addEventListener('pointerdown', handlePointerDown)
    }

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open, onDismiss, ref])
}

function UserMenu({
  open,
  userLabel = '管理员',
  userDescription,
  logoutLabel = '退出登录',
  logoutPending = false,
  onLogout,
}: {
  open: boolean
  userLabel?: string
  userDescription?: string
  logoutLabel?: string
  logoutPending?: boolean
  onLogout?: () => void
}) {
  if (!open) return null

  const initials = getInitials(userLabel)

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
      <div className="border-b border-border/70 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userLabel}</p>
            <p className="truncate text-xs text-muted-foreground">{userDescription ?? 'Backoffice account'}</p>
          </div>
        </div>
      </div>
      <div className="p-2">
        {onLogout ? (
          <button
            type="button"
            disabled={logoutPending}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
            onClick={onLogout}
          >
            <LogOut className="size-4" />
            {logoutPending ? '退出中...' : logoutLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function Topbar({
  title,
  actions,
  breadcrumbs,
  sidebarCollapsed,
  preferences,
  onToggleSidebar,
  onOpenMobileSidebar,
  searchPlaceholder = 'Search',
  userLabel = '管理员',
  userDescription,
  logoutLabel = '退出登录',
  logoutPending = false,
  onLogout,
}: TopbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const initials = getInitials(userLabel)

  useDismissableLayer(userMenuOpen, () => setUserMenuOpen(false), userMenuRef)

  return (
    <header
      className={cn(
        'top-0 z-50 shrink-0 overflow-hidden border-b border-border bg-background/50 backdrop-blur-md',
        preferences.navbarBehavior === 'sticky' && 'sticky',
      )}
    >
      <div className="flex h-12 w-full items-center justify-between px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-1 lg:gap-2">
          <button
            type="button"
            aria-label="打开导航"
            className="grid size-8 place-items-center rounded-md text-foreground/75 transition hover:bg-accent hover:text-foreground md:hidden"
            onClick={onOpenMobileSidebar}
          >
            <Menu className="size-4" />
          </button>
          <button
            type="button"
            aria-label={sidebarCollapsed ? '展开导航' : '折叠导航'}
            className="hidden size-8 place-items-center rounded-md text-foreground/75 transition hover:bg-accent hover:text-foreground md:grid"
            onClick={onToggleSidebar}
          >
            <PanelLeft className={cn('size-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
          </button>
          <span className="mx-2 hidden h-4 w-px shrink-0 bg-border md:block" />
          <button
            type="button"
            className="hidden h-8 items-center gap-2 rounded-md px-0 text-sm font-normal text-foreground/75 transition hover:text-foreground sm:flex"
          >
            <Search className="size-4" />
            <span>{searchPlaceholder}</span>
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>J
            </kbd>
          </button>
          <div className="min-w-0">
            <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
              {breadcrumbs?.map((crumb, index) => (
                <span key={`${crumb}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? <span>/</span> : null}
                  <span className={index === breadcrumbs.length - 1 ? 'text-foreground' : undefined}>{crumb}</span>
                </span>
              ))}
            </div>
            <p className="truncate text-base font-semibold tracking-[-0.02em] text-foreground md:hidden">{title}</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {actions}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              onClick={() => setUserMenuOpen((open) => !open)}
            >
              {initials}
            </button>
            <UserMenu
              open={userMenuOpen}
              userLabel={userLabel}
              userDescription={userDescription}
              logoutLabel={logoutLabel}
              logoutPending={logoutPending}
              onLogout={() => {
                setUserMenuOpen(false)
                onLogout?.()
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
