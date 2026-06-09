'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Inbox, X } from 'lucide-react'
import { useAuthStore } from '@mini-schedule/api/auth'
import { getBackofficePageLabel } from '@mini-schedule/admin-system'
import { ProtectedAppLayout } from '@mini-schedule/admin-system/shell/protected-app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { brandNavItems } from '@/config/nav'
import { brandMessageSummary } from '@/lib/message-center-data'
import { PermissionsProvider } from '@/lib/permissions'

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
  const brandNavGroups = [
    { label: '控制台', items: brandNavItems.slice(0, 1) },
    { label: '品牌运营', items: brandNavItems.slice(1) },
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
      navItems={brandNavItems}
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
        router.replace('/login')
        router.refresh()
      }}
    >
      {children}
    </ProtectedAppLayout>
  )
}
