'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useAppClassSessions,
  useAppUsableEntitlements,
  useAppCreateBooking,
  useAppJoinWaitlist,
  appBookingErrorText,
  type AppClassSession,
} from '@mini-schedule/api/app'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ProtectedLayout } from '@/components/layout/protected-layout'

function fmtRange(startIso: string, endIso: string): string {
  const s = new Date(startIso)
  const e = new Date(endIso)
  const opts: Intl.DateTimeFormatOptions = { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
  const sStr = s.toLocaleString('zh-CN', opts)
  const eStr = e.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${sStr}–${eStr}`
}

function BookSessionDialog({ session, onClose }: { session: AppClassSession | null; onClose: () => void }) {
  const sessionId = session?.id ?? null
  const { data: usable, isLoading: usableLoading } = useAppUsableEntitlements(sessionId)
  const createBooking = useAppCreateBooking()
  const [err, setErr] = useState<string | null>(null)

  const auto = usable?.find((u) => u.auto_selected) ?? usable?.[0]
  const noEntitlement = !usableLoading && (!usable || usable.length === 0)

  const handleConfirm = async () => {
    if (!session) return
    setErr(null)
    try {
      await createBooking.mutateAsync({ class_session_id: session.id })
      toast.success('预约成功')
      onClose()
    } catch (e) {
      setErr(appBookingErrorText(e))
    }
  }

  return (
    <Dialog open={!!session} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认预约</DialogTitle>
          <DialogDescription>{session?.course_title}</DialogDescription>
        </DialogHeader>
        {session && (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{fmtRange(session.starts_at, session.ends_at)} · {session.location_name}</p>
            {usableLoading ? (
              <p className="text-muted-foreground">权益加载中...</p>
            ) : noEntitlement ? (
              <p className="text-destructive">你暂无可用权益，请联系机构购买或开通</p>
            ) : (
              <p>将使用权益：<span className="font-medium">{auto?.product_name}</span>
                {auto?.remaining_credits != null ? `（剩余 ${auto.remaining_credits} 次）` : '（不限次）'}
              </p>
            )}
            {err && <p className="text-destructive" data-testid="book-error">{err}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleConfirm} disabled={createBooking.isPending || noEntitlement || usableLoading}>
            {createBooking.isPending ? '预约中...' : '确认预约'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ClassSessionsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAppClassSessions(page, 20)
  const [booking, setBooking] = useState<AppClassSession | null>(null)
  const joinWaitlist = useAppJoinWaitlist()

  const handleJoinWaitlist = async (s: AppClassSession) => {
    try {
      await joinWaitlist.mutateAsync({ class_session_id: s.id })
      toast.success('已加入候补')
    } catch (e) {
      toast.error(appBookingErrorText(e))
    }
  }

  return (
    <ProtectedLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">课程表</h1>

        {isLoading ? (
          <p className="text-muted-foreground">加载中...</p>
        ) : !data?.items.length ? (
          <p className="text-muted-foreground">暂无可预约的课程</p>
        ) : (
          <div className="grid gap-3">
            {data.items.map((s) => {
              const remaining = Math.max(0, s.capacity - s.booked_count)
              const full = remaining <= 0
              return (
                <Card key={s.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{s.course_title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{fmtRange(s.starts_at, s.ends_at)}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.location_name} · {full ? <span className="text-destructive">已满</span> : `剩余 ${remaining}`}
                      </p>
                    </div>
                    {full ? (
                      <Button size="sm" variant="outline" disabled={joinWaitlist.isPending} onClick={() => handleJoinWaitlist(s)}>
                        加入候补
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setBooking(s)}>预约</Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {data && data.total > data.page_size && (
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / data.page_size)} onClick={() => setPage((p) => p + 1)}>下一页</Button>
          </div>
        )}
      </div>

      <BookSessionDialog session={booking} onClose={() => setBooking(null)} />
    </ProtectedLayout>
  )
}
