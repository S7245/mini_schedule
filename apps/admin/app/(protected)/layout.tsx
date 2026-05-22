'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Inbox } from 'lucide-react'
import { useAdminLogout } from '@mini-schedule/api/admin'
import { useAuthStore } from '@mini-schedule/api/auth'
import { getBackofficePageLabel } from '@mini-schedule/admin-system'
import { ProtectedAppLayout } from '@mini-schedule/admin-system/shell/protected-app-layout'
import { AdminGuard } from '@/components/layout/admin-guard'
import { Button } from '@/components/ui/button'
import { adminNavItems } from '@/config/nav'
import { adminMessageSummary } from '@/lib/message-center-data'

interface ProtectedLayoutProps {
  children: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useAdminLogout()

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
        pathname={pathname}
        sidebarStyle="floating"
        sidebarFooter={
          <div className="rounded-xl border border-sidebar-border bg-background/80 p-3 text-sidebar-foreground shadow-sm">
            <p className="text-sm font-semibold">需要更多帮助？</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              查看消息中心，或联系平台管理员处理运营问题。
            </p>
          </div>
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
