'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore, useAuthHydrated } from '@mini-schedule/api/auth'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const authHydrated = useAuthHydrated()

  useEffect(() => {
    // Wait for the persisted store to rehydrate before judging auth state. On a
    // hard load `isAuthenticated` is transiently false; redirecting here would
    // bounce a logged-in user to /login.
    if (!authHydrated) return
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }
    if (user?.user_type !== 'app') {
      router.push('/unauthorized')
    }
  }, [authHydrated, isAuthenticated, user, router, pathname])

  if (!authHydrated || !isAuthenticated) return null
  return <>{children}</>
}
