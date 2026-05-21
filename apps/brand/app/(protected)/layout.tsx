'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@mini-schedule/api/auth'
import { getBackofficePageLabel } from '@mini-schedule/admin-system'
import { ProtectedAppLayout } from '@mini-schedule/admin-system/shell/protected-app-layout'
import { brandNavItems } from '@/config/nav'

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
      topbarTitle={getBackofficePageLabel(
        pathname,
        brandNavItems,
        '品牌管理后台',
      )}
      searchPlaceholder="搜索学员、课程或训练"
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
