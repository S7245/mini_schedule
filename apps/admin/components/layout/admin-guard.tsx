'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, useAuthHydrated } from '@mini-schedule/api/auth'

interface AdminGuardProps {
  children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const authHydrated = useAuthHydrated()

  useEffect(() => {
    // Wait for the persisted store to rehydrate before judging auth state. On a
    // hard load `isAuthenticated` is transiently false; redirecting here would
    // bounce a logged-in admin to /login.
    if (!authHydrated) return

    if (!isAuthenticated) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    if (user && user.user_type !== 'admin') {
      router.replace('/unauthorized')
    }
  }, [authHydrated, isAuthenticated, pathname, router, user])

  if (!authHydrated || !isAuthenticated || (user && user.user_type !== 'admin')) {
    return null
  }

  return <>{children}</>
}
