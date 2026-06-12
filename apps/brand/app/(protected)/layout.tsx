'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Inbox, X } from 'lucide-react'
import { useAuthStore } from '@mini-schedule/api/auth'
import { getBackofficePageLabel } from '@mini-schedule/admin-system'
import { ProtectedAppLayout } from '@mini-schedule/admin-system/shell/protected-app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { brandNavItems } from '@/config/nav'
import { brandMessageSummary } from '@/lib/message-center-data'
import { PermissionsProvider, PERMISSIONS, usePermissions } from '@/lib/permissions'

/**
 * Route prefix → permission code map for menu visibility.
 *
 * Anything not listed here stays visible by default. The map is intentionally
 * sparse so menu items predating Batch 6 (users / courses / trainings /
 * messages) remain visible until their own batch defines a permission for
 * them.
 *
 * Note: we hide the menu entry entirely instead of disabling it. A user
 * without staff.view can't even see the staff section; per-action protection
 * (create / delete / etc.) is handled at button level via disabled + tooltip.
 */
const NAV_HREF_PERMISSIONS: Record<string, string> = {
  '/staff': PERMISSIONS.STAFF_VIEW,
  '/locations': PERMISSIONS.LOCATION_VIEW,
  '/roles': PERMISSIONS.ROLE_MANAGE,
}

interface ProtectedLayoutProps {
  children: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <PermissionsProvider>
      <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
    </PermissionsProvider>
  )
}

function ProtectedLayoutInner({ children }: ProtectedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [supportCardOpen, setSupportCardOpen] = useState(true)
  const [sidebarTopInset, setSidebarTopInset] = useState(0)
  const { isAuthenticated, user, logout } = useAuthStore()
  const { has, isLoading: permsLoading } = usePermissions()
  const queryClient = useQueryClient()

  // Filter nav by permission. While the permission set is still loading we
  // optimistically render the full menu — otherwise the user sees the sidebar
  // flicker / empty out on every page nav. The button-level guards (F03) keep
  // unauthorized clicks safe during that brief window. Once loaded, items the
  // user can't see at all are removed.
  const visibleNavItems = brandNavItems.filter((item) => {
    const required = NAV_HREF_PERMISSIONS[item.href]
    if (!required) return true
    if (permsLoading) return true
    return has(required)
  })
  const brandNavGroups = [
    { label: '控制台', items: visibleNavItems.slice(0, 1) },
    { label: '品牌运营', items: visibleNavItems.slice(1) },
  ]

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getPlatform().then((platform) => {
        if (platform === 'darwin') setSidebarTopInset(28)
      })
    }

    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    // Verify user type is 'brand'
    if (user?.user_type !== 'brand') {
      router.push('/unauthorized')
    }
  }, [isAuthenticated, user, router, pathname])

  if (!isAuthenticated) {
    return null
  }

  return (
    <ProtectedAppLayout
      appName="品牌管理后台"
      navItems={visibleNavItems}
      navGroups={brandNavGroups}
      pathname={pathname}
      sidebarStyle="inset"
      sidebarTopInset={sidebarTopInset}
      sidebarFooter={
        supportCardOpen ? (
          <Card className="relative overflow-hidden border-sidebar-border bg-background shadow-none">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="关闭运营协助提示"
              className="absolute right-2 top-2 size-6 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setSupportCardOpen(false)}
            >
              <X className="size-3.5" />
            </Button>
            <CardHeader className="space-y-1 p-3 pr-9">
              <CardTitle className="text-sm font-semibold leading-5">
                需要运营协助？
              </CardTitle>
              <CardDescription className="text-sm leading-5">
                查看消息中心，或联系平台支持处理运营问题。
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null
      }
      topbarTitle={getBackofficePageLabel(
        pathname,
        brandNavItems,
        '品牌管理后台',
      )}
      topbarActions={
        <Button
          variant="default"
          size="icon"
          asChild
          className="relative size-8 rounded-lg shadow-sm"
        >
          <Link href="/messages">
            <Inbox className="size-4" />
            <span className="sr-only">消息中心</span>
            <span className="absolute -right-1 -top-1 rounded-full border border-background bg-background px-1 text-[10px] font-semibold leading-4 text-foreground">
              {brandMessageSummary.unread}
            </span>
          </Link>
        </Button>
      }
      searchPlaceholder="搜索学员、课程、训练或消息"
      userLabel={user?.display_name ?? '品牌管理员'}
      userDescription={user?.role ?? 'brand'}
      onLogout={() => {
        logout()
        // Drop the previous user's cached permissions / brand-scoped lists so
        // they don't linger in memory or leak into the next login.
        queryClient.clear()
        router.replace('/login')
        router.refresh()
      }}
    >
      {children}
    </ProtectedAppLayout>
  )
}
