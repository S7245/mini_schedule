'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { BackofficeNavGroup, BackofficeNavItem } from '../models/nav'
import { getBackofficeBreadcrumbs } from '../models/nav'
import { AppShell } from './app-shell'
import { PageContainer } from './page-container'
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
  sidebarFooter?: ReactNode
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
  sidebarFooter,
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

  useEffect(() => {
    setSidebarOpen(readSidebarCookie())
  }, [])

  const setOpen = (open: boolean) => {
    setSidebarOpen(open)
    writeSidebarCookie(open)
  }

  const breadcrumbs = useMemo(
    () => getBackofficeBreadcrumbs(pathname, navItems, topbarTitle),
    [navItems, pathname, topbarTitle],
  )

  return (
    <AppShell
      sidebarCollapsed={!sidebarOpen}
      sidebar={
        <Sidebar
          appName={appName}
          items={navItems}
          groups={navGroups}
          pathname={pathname}
          collapsed={!sidebarOpen}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
          footer={sidebarFooter}
        />
      }
      topbar={
        <Topbar
          title={topbarTitle}
          actions={topbarActions}
          breadcrumbs={breadcrumbs}
          sidebarCollapsed={!sidebarOpen}
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
      <PageContainer>{children}</PageContainer>
    </AppShell>
  )
}
