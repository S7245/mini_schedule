'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBrandOnboardingStatus } from '@mini-schedule/api/onboarding'
import { ONBOARDING_STEP_ROUTES } from '@/components/onboarding/wizard-shell'

export default function OnboardingIndexPage() {
  const router = useRouter()
  const { data, isLoading } = useBrandOnboardingStatus()

  useEffect(() => {
    if (!data) return
    if (data.overall_status === 'completed') {
      router.replace('/dashboard')
      return
    }
    const next = data.next_step_key ?? 'brand_profile'
    router.replace(ONBOARDING_STEP_ROUTES[next])
  }, [data, router])

  return (
    <div className="flex min-h-full items-center justify-center py-20 text-sm text-muted-foreground">
      {isLoading ? '正在加载...' : '正在跳转到下一步...'}
    </div>
  )
}
