'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, ChevronRight, CreditCard, EllipsisVertical, LogOut, UserRound, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import type { BackofficeNavGroup, BackofficeNavItem } from '../models/nav'
import { isBackofficeNavItemActive } from '../models/nav'
import { cn } from '../lib/cn'
import { getInitials } from './preferences'
import type { SidebarStyle } from './preferences'

interface SidebarProps {
  appName: string
  items?: BackofficeNavItem[]
  groups?: BackofficeNavGroup[]
  pathname: string
  collapsed?: boolean
  hidden?: boolean
  sidebarStyle?: SidebarStyle
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  footer?: ReactNode
  userLabel?: string
  userDescription?: string
  logoutLabel?: string
  logoutPending?: boolean
  onLogout?: () => void
}

interface CollapsedTooltipState {
  label: string
  left: number
  top: number
  status: 'open' | 'closing'
}

function CollapsedSidebarTooltip({
  tooltip,
  onMouseEnter,
  onMouseLeave,
}: {
  tooltip: CollapsedTooltipState | null
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  if (!tooltip) return null

  return (
    <div
      className={cn(
        'fixed z-[80] flex -translate-y-1/2 items-center transition-[opacity,transform] duration-150 ease-out',
        tooltip.status === 'open' ? 'translate-x-0 scale-100 opacity-100' : '-translate-x-1 scale-95 opacity-0',
      )}
      style={{ left: tooltip.left, top: tooltip.top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span aria-hidden="true" className="block h-9 w-2" />
      <div className="relative flex items-center">
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-foreground shadow-lg"
        />
        <span className="relative whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg">
          {tooltip.label}
        </span>
      </div>
    </div>
  )
}

function NavLink({
  item,
  pathname,
  collapsed,
  nested = false,
  onNavigate,
  onTooltipShow,
  onTooltipHide,
}: {
  item: BackofficeNavItem
  pathname: string
  collapsed: boolean
  nested?: boolean
  onNavigate?: () => void
  onTooltipShow?: (label: string, element: HTMLElement) => void
  onTooltipHide?: () => void
}) {
  const active = isBackofficeNavItemActive(pathname, item)
  const hasChildren = !!item.items?.length

  return (
    <div className="relative">
      <Link
        href={item.href}
        onFocus={(event) => {
          if (collapsed && !nested) onTooltipShow?.(item.label, event.currentTarget)
        }}
        onBlur={onTooltipHide}
        onMouseEnter={(event) => {
          if (collapsed && !nested) onTooltipShow?.(item.label, event.currentTarget)
        }}
        onMouseLeave={onTooltipHide}
        onClick={onNavigate}
        className={cn(
          'group relative flex min-h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
          collapsed && !nested && 'justify-center px-2',
          nested && 'min-h-8 pl-10 text-[13px]'
        )}
      >
        {item.icon ? (
          <span
            className={cn(
              'grid size-4 shrink-0 place-items-center text-sidebar-foreground/65 transition-colors',
              active && 'text-primary',
            )}
          >
            {item.icon}
          </span>
        ) : null}
        <span className={cn('truncate', collapsed && !nested && 'sr-only')}>{item.label}</span>
        {item.badge && !collapsed ? (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {item.badge}
          </span>
        ) : null}
        {hasChildren && !collapsed ? <ChevronRight className="ml-auto size-3.5 text-muted-foreground" /> : null}
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
              onTooltipShow={onTooltipShow}
              onTooltipHide={onTooltipHide}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SidebarUserCard({
  collapsed,
  userLabel = '管理员',
  userDescription,
  logoutLabel = '退出登录',
  logoutPending = false,
  onLogout,
  onTooltipShow,
  onTooltipHide,
}: {
  collapsed: boolean
  userLabel?: string
  userDescription?: string
  logoutLabel?: string
  logoutPending?: boolean
  onLogout?: () => void
  onTooltipShow?: (label: string, element: HTMLElement) => void
  onTooltipHide?: () => void
}) {
  const initials = getInitials(userLabel)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="打开用户菜单"
          onFocus={(event) => {
            if (collapsed) onTooltipShow?.(userLabel, event.currentTarget)
          }}
          onBlur={onTooltipHide}
          onMouseEnter={(event) => {
            if (collapsed) onTooltipShow?.(userLabel, event.currentTarget)
          }}
          onMouseLeave={onTooltipHide}
          className={cn(
            'group relative flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
            collapsed && 'size-8 justify-center p-2',
          )}
        >
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {initials}
          </div>
          {!collapsed ? (
            <>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userLabel}</span>
                <span className="truncate text-xs text-muted-foreground">{userDescription ?? 'Backoffice account'}</span>
              </div>
              <EllipsisVertical className="ml-auto size-4 text-muted-foreground transition group-hover:text-sidebar-accent-foreground" />
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="right"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{userLabel}</span>
              <span className="truncate text-xs text-muted-foreground">{userDescription ?? 'Backoffice account'}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserRound />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!onLogout || logoutPending}
          onSelect={() => onLogout?.()}
        >
          <LogOut />
          {logoutPending ? '退出中...' : logoutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SidebarContent({
  appName,
  groups,
  pathname,
  collapsed,
  footer,
  floating = false,
  userLabel,
  userDescription,
  logoutLabel,
  logoutPending,
  onLogout,
  onNavigate,
}: {
  appName: string
  groups: BackofficeNavGroup[]
  pathname: string
  collapsed: boolean
  footer?: ReactNode
  floating?: boolean
  userLabel?: string
  userDescription?: string
  logoutLabel?: string
  logoutPending?: boolean
  onLogout?: () => void
  onNavigate?: () => void
}) {
  const [tooltip, setTooltip] = useState<CollapsedTooltipState | null>(null)
  const hideTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openTooltipFrame = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      clearHideTooltip()
      if (openTooltipFrame.current) {
        cancelAnimationFrame(openTooltipFrame.current)
      }
    }
  }, [])

  const clearHideTooltip = () => {
    if (hideTooltipTimer.current) {
      clearTimeout(hideTooltipTimer.current)
      hideTooltipTimer.current = null
    }
  }

  const showCollapsedTooltip = (label: string, element: HTMLElement) => {
    if (!collapsed) return
    clearHideTooltip()
    if (openTooltipFrame.current) {
      cancelAnimationFrame(openTooltipFrame.current)
      openTooltipFrame.current = null
    }

    const rect = element.getBoundingClientRect()
    const nextTooltip = {
      label,
      left: rect.right,
      top: rect.top + rect.height / 2,
      status: 'closing' as const,
    }

    setTooltip(nextTooltip)
    openTooltipFrame.current = requestAnimationFrame(() => {
      setTooltip((current) => {
        if (!current) return current
        if (current.label !== nextTooltip.label || current.left !== nextTooltip.left || current.top !== nextTooltip.top) {
          return current
        }

        return { ...current, status: 'open' }
      })
      openTooltipFrame.current = null
    })
  }

  const hideCollapsedTooltip = () => {
    setTooltip((current) => {
      if (!current) return null
      return { ...current, status: 'closing' }
    })

    clearHideTooltip()
    hideTooltipTimer.current = setTimeout(() => {
      setTooltip(null)
      hideTooltipTimer.current = null
    }, 90)
  }

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 items-center px-4', collapsed && 'justify-center px-2')}>
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center bg-primary text-sm font-semibold text-primary-foreground',
              floating ? 'rounded-lg shadow-sm' : 'rounded-full',
            )}
          >
            MS
          </span>
          <div className={cn('min-w-0', collapsed && 'sr-only')}>
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">{appName}</span>
            <span className="block truncate text-xs text-muted-foreground">Operations workspace</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
        <div className="space-y-4">
          {groups.map((group, index) => (
            <div key={group.label ?? `group-${index}`} className="space-y-2">
              {group.label && !collapsed ? (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/90">
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
                    onTooltipShow={showCollapsedTooltip}
                    onTooltipHide={hideCollapsedTooltip}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className={cn('space-y-3 p-3 pt-0', collapsed && 'px-2')}>
        {!collapsed ? footer : null}
        <SidebarUserCard
          collapsed={collapsed}
          userLabel={userLabel}
          userDescription={userDescription}
          logoutLabel={logoutLabel}
          logoutPending={logoutPending}
          onLogout={onLogout}
          onTooltipShow={showCollapsedTooltip}
          onTooltipHide={hideCollapsedTooltip}
        />
      </div>
      <CollapsedSidebarTooltip
        tooltip={collapsed ? tooltip : null}
        onMouseEnter={clearHideTooltip}
        onMouseLeave={hideCollapsedTooltip}
      />
    </div>
  )
}

export function Sidebar({
  appName,
  items = [],
  groups,
  pathname,
  collapsed = false,
  hidden = false,
  sidebarStyle = 'inset',
  mobileOpen = false,
  onMobileOpenChange,
  footer,
  userLabel,
  userDescription,
  logoutLabel,
  logoutPending,
  onLogout,
}: SidebarProps) {
  const navGroups = groups ?? [{ items }]
  const floating = sidebarStyle === 'floating'

  return (
    <>
      <aside
        data-sidebar-style={sidebarStyle}
        className={cn(
          'fixed left-0 z-40 hidden bg-sidebar text-sidebar-foreground transition-[width,transform,opacity,left] duration-200 ease-linear md:block',
          floating
            ? 'bottom-3 top-3 ml-3 overflow-visible rounded-xl border border-sidebar-border shadow-[0_16px_48px_rgba(15,23,42,0.10)]'
            : 'inset-y-0 overflow-visible border-r border-sidebar-border',
          hidden
            ? 'pointer-events-none w-0 -translate-x-8 opacity-0'
            : collapsed
              ? floating
                ? 'w-[4rem]'
                : 'w-[4.5rem]'
              : floating
                ? 'w-[16rem]'
                : 'w-[17rem]',
        )}
      >
        <SidebarContent
          appName={appName}
          groups={navGroups}
          pathname={pathname}
          collapsed={collapsed && !hidden}
          floating={floating}
          footer={footer}
          userLabel={userLabel}
          userDescription={userDescription}
          logoutLabel={logoutLabel}
          logoutPending={logoutPending}
          onLogout={onLogout}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="关闭导航遮罩"
            className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
            onClick={() => onMobileOpenChange?.(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[18rem] max-w-[88vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl">
            <button
              type="button"
              aria-label="关闭导航"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => onMobileOpenChange?.(false)}
            >
              <X className="size-4" />
            </button>
            <SidebarContent
              appName={appName}
              groups={navGroups}
              pathname={pathname}
              collapsed={false}
              floating={false}
              footer={footer}
              userLabel={userLabel}
              userDescription={userDescription}
              logoutLabel={logoutLabel}
              logoutPending={logoutPending}
              onLogout={onLogout}
              onNavigate={() => onMobileOpenChange?.(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  )
}
