'use client'

import Link from 'next/link'
import { ArrowUpRight, Rocket } from 'lucide-react'
import { useBrandOnboardingStatus } from '@mini-schedule/api/onboarding'
import {
  useUnreadCount,
  useNotifications,
} from '@mini-schedule/api/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import {
  notificationEventLabel,
  formatNotificationTime,
} from '@mini-schedule/core/notifications'
import {
  ONBOARDING_STEP_KEYS,
  ONBOARDING_STEP_LABELS,
} from '@/components/onboarding/wizard-shell'

function OnboardingProgressCard() {
  const { data } = useBrandOnboardingStatus()
  if (!data) return null
  if (data.overall_status === 'completed') return null

  const totalSteps = ONBOARDING_STEP_KEYS.length
  const doneSteps = data.steps.filter(
    (s) => s.status === 'completed' || s.status === 'skipped',
  ).length
  const pct = Math.round((doneSteps / totalSteps) * 100)
  const nextKey = data.next_step_key
  const nextLabel = nextKey ? ONBOARDING_STEP_LABELS[nextKey] : '继续开通'

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5" data-testid="dashboard-onboarding-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="size-5 text-primary" />
            完成品牌开通
          </CardTitle>
          <CardDescription className="mt-1">
            还差 {totalSteps - doneSteps} 步：下一步「{nextLabel}」
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/onboarding">继续完成开通</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
            data-testid="dashboard-onboarding-progress"
            data-progress={pct}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          已完成 {doneSteps}/{totalSteps} 步
        </p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const unreadQuery = useUnreadCount()
  const recentQuery = useNotifications({ status: 'all', page: 1, page_size: 5 })
  const unread = unreadQuery.data?.count ?? 0
  const recent = recentQuery.data?.items ?? []

  return (
    <ProtectedLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">概览</h1>

        <OnboardingProgressCard />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">学员总数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">待接入</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">课程总数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">待接入</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">未读通知</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{unread}</p>
              <p className="text-xs text-muted-foreground mt-1">来自预约、场次和订阅提醒</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>最近通知</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  预约、候补、场次与订阅的后台站内通知。
                </p>
              </div>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                查看全部
                <ArrowUpRight className="size-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recent.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  暂无通知
                </p>
              ) : (
                recent.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-md border border-border bg-background px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        {n.body && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {n.body}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {notificationEventLabel(n.event_type)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatNotificationTime(n.created_at)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
