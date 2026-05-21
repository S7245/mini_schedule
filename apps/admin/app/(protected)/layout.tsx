'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminLogout } from '@mini-schedule/api/admin'
import { useAuthStore } from '@mini-schedule/api/auth'
import { getBackofficePageLabel } from '@mini-schedule/admin-system'
import { ProtectedAppLayout } from '@mini-schedule/admin-system/shell/protected-app-layout'
import { AdminGuard } from '@/components/layout/admin-guard'
import { adminNavItems } from '@/config/nav'

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
        topbarTitle={getBackofficePageLabel(
          pathname,
          adminNavItems,
          '平台管理后台',
        )}
        searchPlaceholder="搜索品牌或管理员"
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
