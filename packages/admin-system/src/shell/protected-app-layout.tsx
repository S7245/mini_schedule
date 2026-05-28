'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { BackofficeNavGroup, BackofficeNavItem } from '../models/nav'
import { getBackofficeBreadcrumbs } from '../models/nav'
import { AppShell } from './app-shell'
import { PageContainer } from './page-container'
import { SHELL_PREFERENCE_DEFAULTS, type SidebarStyle } from './preferences'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

const SIDEBAR_COOKIE_NAME = 'mini_schedule_sidebar_state'

interface ProtectedAppLayoutProps {
  appName: string
  navItems: BackofficeNavItem[]
  navGroups?: BackofficeNavGroup[]
  pathname: string
  topbarTitle: string
  topbarActions?: ReactNode
  sidebarHeaderContent?: ReactNode
  sidebarFooter?: ReactNode
  sidebarStyle?: SidebarStyle
  /** Extra top padding (px) for the sidebar — use to clear OS chrome (e.g. macOS traffic lights) */
  sidebarTopInset?: number
  searchPlaceholder?: string
  userLabel?: string
  userDescription?: string
  logoutLabel?: string
  logoutPending?: boolean
  onLogout?: () => void
  children: ReactNode
}

function readSidebarCookie() {
  if (typeof document === 'undefined') return true
  return !document.cookie
    .split('; ')
    .some((entry) => entry === `${SIDEBAR_COOKIE_NAME}=collapsed`)
}

function writeSidebarCookie(open: boolean) {
  if (typeof document === 'undefined') return
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open ? 'expanded' : 'collapsed'}; path=/; max-age=604800`
}

export function ProtectedAppLayout({
  appName,
  navItems,
  navGroups,
  pathname,
  topbarTitle,
  topbarActions,
  sidebarHeaderContent,
  sidebarFooter,
  sidebarStyle,
  sidebarTopInset = 0,
  searchPlaceholder,
  userLabel,
  userDescription,
  logoutLabel,
  logoutPending,
  onLogout,
  children,
}: ProtectedAppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const preferences = useMemo(
    () => ({
      ...SHELL_PREFERENCE_DEFAULTS,
      sidebarStyle: sidebarStyle ?? SHELL_PREFERENCE_DEFAULTS.sidebarStyle,
    }),
    [sidebarStyle],
  )

  useEffect(() => {
    setSidebarOpen(readSidebarCookie())
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
  }, [preferences])

  const setOpen = (open: boolean) => {
    setSidebarOpen(open)
    writeSidebarCookie(open)
  }

  const breadcrumbs = useMemo(
    () => getBackofficeBreadcrumbs(pathname, navItems, topbarTitle),
    [navItems, pathname, topbarTitle],
  )

  const desktopSidebarCollapsed = !sidebarOpen
  const desktopSidebarHidden =
    preferences.sidebarCollapseMode === 'offcanvas' && desktopSidebarCollapsed

  return (
    <AppShell
      preferences={preferences}
      sidebarCollapsed={desktopSidebarCollapsed}
      desktopSidebarHidden={desktopSidebarHidden}
      sidebar={
        <Sidebar
          appName={appName}
          items={navItems}
          groups={navGroups}
          pathname={pathname}
          collapsed={desktopSidebarCollapsed}
          hidden={desktopSidebarHidden}
          sidebarStyle={preferences.sidebarStyle}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
          headerContent={sidebarHeaderContent}
          footer={sidebarFooter}
          topInset={sidebarTopInset}
          userLabel={userLabel}
          userDescription={userDescription}
          logoutLabel={logoutLabel}
          logoutPending={logoutPending}
          onLogout={onLogout}
        />
      }
      topbar={
        <Topbar
          title={topbarTitle}
          actions={topbarActions}
          breadcrumbs={breadcrumbs}
          sidebarCollapsed={desktopSidebarCollapsed}
          preferences={preferences}
          onToggleSidebar={() => setOpen(!sidebarOpen)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          searchPlaceholder={searchPlaceholder}
          userLabel={userLabel}
          userDescription={userDescription}
          logoutLabel={logoutLabel}
          logoutPending={logoutPending}
          onLogout={onLogout}
        />
      }
    >
      <PageContainer pageLayout={preferences.pageLayout}>{children}</PageContainer>
    </AppShell>
  )
}
