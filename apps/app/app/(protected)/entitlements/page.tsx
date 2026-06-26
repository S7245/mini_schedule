'use client'

import { useAppEntitlements, type AppEntitlement } from '@mini-schedule/api/app'
import { Card, CardContent } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'

const STATUS_LABEL: Record<string, string> = {
  active: '生效中',
  expired: '已过期',
  depleted: '已用完',
  frozen: '已冻结',
  cancelled: '已作废',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function creditsText(e: AppEntitlement): string {
  if (e.total_credits == null || e.remaining_credits == null) return '不限次'
  return `剩余 ${e.remaining_credits} / ${e.total_credits} 次`
}

export default function EntitlementsPage() {
  const { data, isLoading } = useAppEntitlements()

  return (
    <ProtectedLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">我的权益</h1>

        {isLoading ? (
          <p className="text-muted-foreground">加载中...</p>
        ) : !data?.length ? (
          <p className="text-muted-foreground">暂无权益，请联系机构购买或开通</p>
        ) : (
          <div className="grid gap-3">
            {data.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{e.product_name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{creditsText(e)}</p>
                  <p className="text-sm text-muted-foreground">有效期至 {fmtDate(e.expires_at)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
