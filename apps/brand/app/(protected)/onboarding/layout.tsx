'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@mini-schedule/api/auth'
import { useBrandProfile } from '@mini-schedule/api/brand-profile'
import { useBrandOnboardingStatus } from '@mini-schedule/api/onboarding'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()

  // (protected) parent already redirects if not authenticated, but be explicit
  // so direct navigation works the way the spec requires: next=/onboarding.
  useEffect(() => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname || '/onboarding')
      router.replace(`/login?next=${next}`)
    }
  }, [isAuthenticated, router, pathname])

  const enabled = isAuthenticated && user?.user_type === 'brand'

  const profileQuery = useBrandProfile(enabled)
  const statusQuery = useBrandOnboardingStatus(enabled)

  // Brand not active → push to payment page (latest pending order); fallback to /signup/plan.
  useEffect(() => {
    const brand = profileQuery.data
    if (!brand) return
    if (brand.status !== 'active') {
      // Defer to a generic re-entry; payment flow lives in (auth)/signup/payment/[order_id]
      // We don't have order_id here without an extra API, so route to plan picker which
      // can re-issue an order (Batch 1/2 flow). Acceptable per Batch 4 contract.
      router.replace('/signup/plan')
    }
  }, [profileQuery.data, router])

  // Already completed → straight to workbench
  useEffect(() => {
    if (statusQuery.data?.overall_status === 'completed') {
      router.replace('/dashboard')
    }
  }, [statusQuery.data, router])

  if (!isAuthenticated) return null
  if (profileQuery.isLoading || statusQuery.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center py-20 text-sm text-muted-foreground">
        正在加载初始化向导...
      </div>
    )
  }

  const brand = profileQuery.data
  if (!brand || brand.status !== 'active') return null
  if (statusQuery.data?.overall_status === 'completed') return null

  return <div className="min-h-full">{children}</div>
}
