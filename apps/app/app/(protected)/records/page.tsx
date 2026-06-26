'use client'

import { useAppBookings } from '@mini-schedule/api/app'
import { Card, CardContent } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'

const STATUS_LABEL: Record<string, string> = { attended: '已到课', no_show: '已爽约' }

function fmtRange(startIso: string, endIso: string): string {
  const s = new Date(startIso)
  const e = new Date(endIso)
  const sStr = s.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  const eStr = e.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${sStr}–${eStr}`
}

export default function RecordsPage() {
  const { data, isLoading } = useAppBookings('attended,no_show', 1, 50)

  return (
    <ProtectedLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">上课记录</h1>

        {isLoading ? (
          <p className="text-muted-foreground">加载中...</p>
        ) : !data?.items.length ? (
          <p className="text-muted-foreground">暂无上课记录</p>
        ) : (
          <div className="grid gap-3">
            {data.items.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{b.course_title}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        b.status === 'attended' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{fmtRange(b.session_starts_at, b.session_ends_at)}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.location_name}
                    {b.hold ? ` · ${b.hold.product_name}` : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
