'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useAppBookings,
  useAppCancelBooking,
  useAppWaitlist,
  useAppCancelWaitlist,
  appBookingErrorText,
  type AppBooking,
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

const STATUS_LABEL: Record<string, string> = {
  booked: '已预约',
  cancelled: '已取消',
  attended: '已到课',
  pending_no_show: '待确认',
  no_show: '已爽约',
}

const FILTERS: { key: string; label: string }[] = [
  { key: 'booked', label: '即将上课' },
  { key: 'waitlist', label: '候补中' },
  { key: 'cancelled', label: '已取消' },
  { key: '', label: '全部' },
]

function fmtRange(startIso: string, endIso: string): string {
  const s = new Date(startIso)
  const e = new Date(endIso)
  const sStr = s.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  const eStr = e.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${sStr}–${eStr}`
}

function CancelDialog({ booking, onClose }: { booking: AppBooking | null; onClose: () => void }) {
  const cancel = useAppCancelBooking()
  const [err, setErr] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!booking) return
    setErr(null)
    try {
      await cancel.mutateAsync({ id: booking.id })
      toast.success('已取消预约')
      onClose()
    } catch (e) {
      setErr(appBookingErrorText(e))
    }
  }

  return (
    <Dialog open={!!booking} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>取消预约</DialogTitle>
          <DialogDescription>{booking?.course_title}</DialogDescription>
        </DialogHeader>
        {booking && (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{fmtRange(booking.session_starts_at, booking.session_ends_at)} · {booking.location_name}</p>
            <p>确定取消该预约吗？取消后名额与权益将按规则释放。</p>
            {err && <p className="text-destructive" data-testid="cancel-error">{err}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>再想想</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={cancel.isPending}>
            {cancel.isPending ? '取消中...' : '确认取消'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function BookingsPage() {
  const [status, setStatus] = useState('booked')
  const showWaitlist = status === 'waitlist'
  const { data, isLoading } = useAppBookings(showWaitlist ? '' : status, 1, 50)
  const waitlist = useAppWaitlist()
  const cancelWaitlist = useAppCancelWaitlist()
  const [cancelling, setCancelling] = useState<AppBooking | null>(null)

  const handleCancelWaitlist = async (id: number) => {
    try {
      await cancelWaitlist.mutateAsync({ id })
      toast.success('已取消候补')
    } catch (e) {
      toast.error(appBookingErrorText(e))
    }
  }

  return (
    <ProtectedLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">我的预约</h1>

        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={status === f.key ? 'default' : 'outline'}
              onClick={() => setStatus(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {showWaitlist ? (
          waitlist.isLoading ? (
            <p className="text-muted-foreground">加载中...</p>
          ) : !waitlist.data?.length ? (
            <p className="text-muted-foreground">暂无候补</p>
          ) : (
            <div className="grid gap-3">
              {waitlist.data.map((w) => (
                <Card key={w.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{w.course_title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(w.session_starts_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                      <p className="text-sm text-muted-foreground">{w.location_name} · 候补第 {w.position} 位</p>
                    </div>
                    <Button size="sm" variant="outline" disabled={cancelWaitlist.isPending} onClick={() => handleCancelWaitlist(w.id)}>取消候补</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : isLoading ? (
          <p className="text-muted-foreground">加载中...</p>
        ) : !data?.items.length ? (
          <p className="text-muted-foreground">暂无预约</p>
        ) : (
          <div className="grid gap-3">
            {data.items.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">{b.course_title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{fmtRange(b.session_starts_at, b.session_ends_at)}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.location_name} · {STATUS_LABEL[b.status] ?? b.status}
                      {b.hold ? ` · ${b.hold.product_name}` : b.status === 'booked' ? ' · 无权益占位' : ''}
                    </p>
                  </div>
                  {b.status === 'booked' && (
                    <Button size="sm" variant="outline" onClick={() => setCancelling(b)}>取消</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CancelDialog booking={cancelling} onClose={() => setCancelling(null)} />
    </ProtectedLayout>
  )
}
