'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import {
  useBrandOnboardingStatus,
  useCompleteOnboarding,
} from '@mini-schedule/api/onboarding'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingCompletePage() {
  const router = useRouter()
  const statusQuery = useBrandOnboardingStatus()
  const completeMutation = useCompleteOnboarding()

  // If all steps done but brand.onboarding_status not yet 'completed',
  // call complete idempotently.
  useEffect(() => {
    const data = statusQuery.data
    if (!data) return
    if (data.overall_status === 'completed') return
    const allDone = data.steps.every(
      (s) => s.status === 'completed' || s.status === 'skipped',
    )
    if (allDone && !completeMutation.isPending) {
      completeMutation.mutate()
    }
  }, [statusQuery.data, completeMutation])

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 px-4 py-16">
      <Card className="max-w-md text-center">
        <CardHeader className="space-y-4 pb-2">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <CardTitle className="text-2xl">开通成功！</CardTitle>
          <CardDescription>
            品牌初始化已完成，欢迎进入工作台开始运营。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={() => router.push('/dashboard')}
            data-testid="enter-workbench"
          >
            进入工作台 →
          </Button>
          <p className="text-xs text-muted-foreground">
            {completeMutation.isPending ? '正在确认完成状态...' : null}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
