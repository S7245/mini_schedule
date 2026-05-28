'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Inbox, PlusCircle, X } from 'lucide-react'
import { useAdminLogout } from '@mini-schedule/api/admin'
import { useAuthStore } from '@mini-schedule/api/auth'
import { getBackofficePageLabel } from '@mini-schedule/admin-system'
import { ProtectedAppLayout } from '@mini-schedule/admin-system/shell/protected-app-layout'
import { AdminGuard } from '@/components/layout/admin-guard'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { adminNavItems } from '@/config/nav'
import { adminMessageSummary } from '@/lib/message-center-data'

interface ProtectedLayoutProps {
  children: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [supportCardOpen, setSupportCardOpen] = useState(true)
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useAdminLogout()
  const adminNavGroups = [
    { label: '控制台', items: adminNavItems.slice(0, 5) },
    { label: '平台运维', items: adminNavItems.slice(5) },
  ]

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } finally {
      logout()
      router.replace('/login')
      router.refresh()
    }
  }

  return (
    <AdminGuard>
      <ProtectedAppLayout
        appName="平台管理后台"
        navItems={adminNavItems}
        navGroups={adminNavGroups}
        pathname={pathname}
        sidebarStyle="inset"
        sidebarHeaderContent={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="h-8 flex-1 justify-start rounded-md px-2">
              <Link href="/brands">
                <PlusCircle className="mr-2 size-4" />
                新建品牌
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="size-9 rounded-md border-sidebar-border bg-background shadow-none"
            >
              <Link href="/messages">
                <Inbox className="size-4" />
                <span className="sr-only">消息中心</span>
              </Link>
            </Button>
          </div>
        }
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
                  查看消息中心，或联系平台管理员处理运营问题。
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null
        }
        topbarTitle={getBackofficePageLabel(
          pathname,
          adminNavItems,
          '平台管理后台',
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
                {adminMessageSummary.unread}
              </span>
            </Link>
          </Button>
        }
        searchPlaceholder="搜索品牌、管理员或消息"
        userLabel={user?.display_name ?? '平台管理员'}
        userDescription={user?.role ?? 'platform'}
        logoutPending={logoutMutation.isPending}
        onLogout={handleLogout}
      >
        {children}
      </ProtectedAppLayout>
    </AdminGuard>
  )
}
