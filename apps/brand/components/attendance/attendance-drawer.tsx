'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  useBrandBookings,
  useAttendBooking,
  useConfirmNoShow,
  useEndSession,
} from '@mini-schedule/api/bookings'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type { Booking, BookingStatus } from '@mini-schedule/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Hint } from '@/components/ui/hint'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const DENIED = '权限不足，请联系管理员'

// 签到名单只关心非取消态。
const STATUS_LABELS: Partial<Record<BookingStatus, string>> = {
  booked: '已约',
  attended: '已到课',
  pending_no_show: '待爽约',
  no_show: '已爽约',
}

const STATUS_BADGE: Partial<Record<BookingStatus, string>> = {
  booked: 'bg-blue-100 text-blue-800',
  attended: 'bg-emerald-100 text-emerald-800',
  pending_no_show: 'bg-amber-100 text-amber-800',
  no_show: 'bg-rose-100 text-rose-800',
}

export interface AttendanceSessionRef {
  id: number
  course_title: string
  starts_at: string
  ends_at: string
  location_name: string
  status: string
}

export interface AttendanceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: AttendanceSessionRef | null
}

function formatRange(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt)
  const e = new Date(endsAt)
  const d = `${s.getFullYear()}/${s.getMonth() + 1}/${s.getDate()}`
  const t = (x: Date) =>
    `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
  return `${d} ${t(s)}–${t(e)}`
}

export function AttendanceDrawer({
  open,
  onOpenChange,
  session,
}: AttendanceDrawerProps) {
  const { has } = usePermissions()
  const canMark = has(PERMISSIONS.ATTENDANCE_MARK)
  const canConfirmNoShow = has(PERMISSIONS.ATTENDANCE_NO_SHOW_CONFIRM)
  const canEnd =
    session?.status === 'scheduled' || session?.status === 'in_progress'

  const query = useBrandBookings(
    { class_session_id: session?.id, page_size: 100 },
    open && Boolean(session),
  )
  // 名单排除已取消（取消不占名额，非签到对象）。
  const roster = useMemo<Booking[]>(
    () => (query.data?.items ?? []).filter((b) => b.status !== 'cancelled'),
    [query.data],
  )
  const counts = useMemo(() => {
    const c = { booked: 0, attended: 0, pending_no_show: 0, no_show: 0 }
    for (const b of roster) {
      if (b.status in c) c[b.status as keyof typeof c] += 1
    }
    return c
  }, [roster])

  const attendMutation = useAttendBooking()
  const noShowMutation = useConfirmNoShow()
  const endMutation = useEndSession()

  const [endConfirm, setEndConfirm] = useState(false)
  const [noShowTarget, setNoShowTarget] = useState<Booking | null>(null)
  const [noShowReason, setNoShowReason] = useState('')

  async function handleAttend(b: Booking) {
    try {
      await attendMutation.mutateAsync({ id: b.id })
      toast.success('已标记到课')
    } catch (err) {
      toast.error(err instanceof ApiErrorClass ? err.message : '操作失败')
    }
  }

  async function confirmEnd() {
    if (!session) return
    try {
      const res = await endMutation.mutateAsync({ sessionId: session.id })
      toast.success(
        `场次已结束，${res.pending_no_show_count} 人转入待爽约`,
      )
      setEndConfirm(false)
    } catch (err) {
      toast.error(err instanceof ApiErrorClass ? err.message : '操作失败')
    }
  }

  async function confirmNoShow() {
    if (!noShowTarget) return
    try {
      await noShowMutation.mutateAsync({
        id: noShowTarget.id,
        reason: noShowReason.trim(),
      })
      toast.success('已确认爽约')
      setNoShowTarget(null)
      setNoShowReason('')
    } catch (err) {
      toast.error(err instanceof ApiErrorClass ? err.message : '操作失败')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" data-testid="attendance-drawer">
          <DialogHeader>
            <DialogTitle>
              签到{session ? ` · ${session.course_title}` : ''}
            </DialogTitle>
            <DialogDescription>
              {session
                ? `${formatRange(session.starts_at, session.ends_at)} · ${session.location_name}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" data-testid="attendance-counts">
              已约 {counts.booked} · 已到课 {counts.attended} · 待爽约{' '}
              {counts.pending_no_show} · 已爽约 {counts.no_show}
            </p>
            <Hint
              content={
                !canMark ? DENIED : !canEnd ? '仅未开始/进行中的场次可结束' : undefined
              }
            >
              <button
                type="button"
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-muted-foreground"
                disabled={!canMark || !canEnd}
                onClick={() => setEndConfirm(true)}
                data-testid="attendance-end-session"
              >
                结束场次
              </button>
            </Hint>
          </div>

          {query.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              加载中...
            </p>
          ) : roster.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              暂无预约学员
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学员</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>权益</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((b) => {
                  const canAttend =
                    b.status === 'booked' || b.status === 'pending_no_show'
                  return (
                    <TableRow key={b.id} data-testid="attendance-row">
                      <TableCell className="font-medium">
                        {b.learner_name || b.learner_phone || `#${b.brand_learner_profile_id}`}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {STATUS_LABELS[b.status] ?? b.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.requires_entitlement_fix ? (
                          <span className="text-amber-700">无权益·占位</span>
                        ) : (
                          b.hold?.product_name || '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-3 text-sm">
                          {canAttend ? (
                            <Hint
                              content={
                                !canMark
                                  ? DENIED
                                  : b.requires_entitlement_fix
                                    ? '占位预约：签到不消费权益，已记异常待补'
                                    : undefined
                              }
                            >
                              <button
                                type="button"
                                className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                                disabled={!canMark || attendMutation.isPending}
                                onClick={() => handleAttend(b)}
                                data-testid="attendance-mark"
                              >
                                标到课
                              </button>
                            </Hint>
                          ) : null}
                          {b.status === 'pending_no_show' ? (
                            <Hint content={canConfirmNoShow ? undefined : DENIED}>
                              <button
                                type="button"
                                className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                                disabled={!canConfirmNoShow}
                                onClick={() => {
                                  setNoShowReason('')
                                  setNoShowTarget(b)
                                }}
                                data-testid="attendance-no-show"
                              >
                                确认爽约
                              </button>
                            </Hint>
                          ) : null}
                          {!canAttend && b.status !== 'pending_no_show' ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={endConfirm}
        title="结束该场次？"
        description={
          <span className="text-sm text-muted-foreground">
            场次将标记为「已完成」，未签到的预约转入「待爽约」等待确认。该操作不可撤销。
          </span>
        }
        confirmText="结束场次"
        loading={endMutation.isPending}
        onCancel={() => setEndConfirm(false)}
        onConfirm={confirmEnd}
      />

      <ConfirmDialog
        open={Boolean(noShowTarget)}
        title="确认爽约？"
        description={
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {noShowTarget
                ? `将把 ${noShowTarget.learner_name || noShowTarget.learner_phone} 标记为爽约，按预约策略扣课或退课。`
                : ''}
            </p>
            <Textarea
              placeholder="处理原因（选填）"
              value={noShowReason}
              onChange={(ev) => setNoShowReason(ev.target.value)}
              rows={2}
              data-testid="attendance-no-show-reason"
            />
          </div>
        }
        confirmText="确认爽约"
        destructive
        loading={noShowMutation.isPending}
        onCancel={() => setNoShowTarget(null)}
        onConfirm={confirmNoShow}
      />
    </>
  )
}
