'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Inbox } from 'lucide-react'
import { useAuthStore } from '@mini-schedule/api/auth'
import { getBackofficePageLabel } from '@mini-schedule/admin-system'
import { ProtectedAppLayout } from '@mini-schedule/admin-system/shell/protected-app-layout'
import { Button } from '@/components/ui/button'
import { brandNavItems } from '@/config/nav'
import { brandMessageSummary } from '@/lib/message-center-data'

interface ProtectedLayoutProps {
  children: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuthStore()

  useEffect(() => {
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
      pathname={pathname}
      sidebarStyle="floating"
      sidebarFooter={
        <div className="rounded-xl border border-sidebar-border bg-background/80 p-3 text-sidebar-foreground shadow-sm">
          <p className="text-sm font-semibold">需要更多帮助？</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            查看消息中心，或联系平台支持处理运营问题。
          </p>
        </div>
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
