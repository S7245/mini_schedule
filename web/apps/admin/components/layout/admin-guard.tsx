'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@mini-schedule/api/auth'

interface AdminGuardProps {
  children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    if (user && user.user_type !== 'admin') {
      router.replace('/unauthorized')
    }
  }, [isAuthenticated, pathname, router, user])

  if (!isAuthenticated || (user && user.user_type !== 'admin')) {
    return null
  }

  return <>{children}</>
}
