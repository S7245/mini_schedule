'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCreateBooking, useUsableEntitlements } from '@mini-schedule/api/bookings'
import { useJoinWaitlist } from '@mini-schedule/api/waitlist'
import { useBrandLearners } from '@mini-schedule/api/learners'
import { useBrandClassSessions } from '@mini-schedule/api/class-sessions'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { EntitlementMode } from '@mini-schedule/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface BookingCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const selectCls =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

function fmt(ts: string): string {
  return ts ? ts.slice(0, 16).replace('T', ' ') : ''
}

function mapError(err: unknown): string {
  if (err instanceof ApiErrorClass) {
    switch (err.code) {
      case ErrorCodes.SESSION_FULL:
        return '该场次已满员，无法预约'
      case ErrorCodes.SESSION_NOT_BOOKABLE:
        return '该场次当前不可预约'
      case ErrorCodes.BOOKING_WINDOW_CLOSED:
        return '当前不在可预约时间窗口内'
      case ErrorCodes.BOOKING_DUPLICATE:
        return '该学员对该场次已有预约'
      case ErrorCodes.BOOKING_FREQUENCY_EXCEEDED:
        return '超过预约频次上限（日/周/月/同时未完成）'
      case ErrorCodes.LEARNER_NOT_BOOKABLE:
        return '该学员当前不可预约（已冻结/停用）'
      case ErrorCodes.ENTITLEMENT_NONE_AVAILABLE:
        return '该学员无可用权益，请改用手动指定或无权益占位'
      case ErrorCodes.ENTITLEMENT_NOT_USABLE:
        return '所选权益不可用（已过期/耗尽/冻结）'
      case ErrorCodes.ENTITLEMENT_SCOPE_MISMATCH:
        return '所选权益不适用于该场次的门店或课程'
      case ErrorCodes.ASSISTED_REASON_REQUIRED:
        return '无权益占位须填写原因'
      case ErrorCodes.WAITLIST_NOT_ALLOWED:
        return '该场次不允许候补'
      case ErrorCodes.WAITLIST_FULL:
        return '候补名额已满'
      case ErrorCodes.WAITLIST_DUPLICATE:
        return '该学员已在该场次候补'
      case ErrorCodes.WAITLIST_SESSION_NOT_FULL:
        return '场次未满，请直接预约'
      default:
        return err.message || '预约失败，请重试'
    }
  }
  return '预约失败，请重试'
}

export function BookingCreateDialog({ open, onOpenChange }: BookingCreateDialogProps) {
  const createMutation = useCreateBooking()
  const [learnerId, setLearnerId] = useState(0)
  const [sessionId, setSessionId] = useState(0)
  const [mode, setMode] = useState<EntitlementMode>('auto')
  const [manualId, setManualId] = useState(0)
  const [reason, setReason] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const learnersQuery = useBrandLearners(
    { status: 'active', page: 1, page_size: 100 },
    open,
  )
  const learners = useMemo(
    () => learnersQuery.data?.items ?? [],
    [learnersQuery.data],
  )

  const sessionsQuery = useBrandClassSessions(
    open ? { status: 'scheduled', page: 1, page_size: 100 } : {},
  )
  const sessions = useMemo(
    () => sessionsQuery.data?.items ?? [],
    [sessionsQuery.data],
  )
  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === sessionId) ?? null,
    [sessions, sessionId],
  )
  const isFull = selectedSession
    ? selectedSession.booked_count >= selectedSession.capacity
    : false
  const joinWaitlist = useJoinWaitlist()

  const usableQuery = useUsableEntitlements(
    sessionId || null,
    learnerId || null,
  )
  const usable = useMemo(() => usableQuery.data ?? [], [usableQuery.data])
  const autoPick = usable.find((u) => u.auto_selected) ?? usable[0]

  useEffect(() => {
    if (!open) return
    setLearnerId(0)
    setSessionId(0)
    setMode('auto')
    setManualId(0)
    setReason('')
    setApiError(null)
  }, [open])

  // 学员/场次变化时清空手动选择（避免残留跨场次的非法权益）。
  useEffect(() => {
    setManualId(0)
  }, [learnerId, sessionId])

  const pending = createMutation.isPending

  function remainText(u: { remaining_credits: number | null }): string {
    return u.remaining_credits === null ? '不限次' : `剩 ${u.remaining_credits} 次`
  }

  async function onSubmit() {
    setApiError(null)
    if (!learnerId || !sessionId) {
      setApiError('请选择学员和场次')
      return
    }
    if (mode === 'manual' && !manualId) {
      setApiError('请选择要使用的权益')
      return
    }
    if (mode === 'none' && !reason.trim()) {
      setApiError('无权益占位须填写原因')
      return
    }
    try {
      await createMutation.mutateAsync({
        class_session_id: sessionId,
        brand_learner_profile_id: learnerId,
        entitlement_mode: mode,
        learner_entitlement_id: mode === 'manual' ? manualId : undefined,
        no_entitlement_reason: mode === 'none' ? reason.trim() : undefined,
      })
      toast.success('预约已创建')
      onOpenChange(false)
    } catch (err) {
      setApiError(mapError(err))
    }
  }

  async function onJoinWaitlist() {
    setApiError(null)
    if (!learnerId || !sessionId) {
      setApiError('请选择学员和场次')
      return
    }
    try {
      await joinWaitlist.mutateAsync({
        class_session_id: sessionId,
        brand_learner_profile_id: learnerId,
      })
      toast.success('已加入候补')
      onOpenChange(false)
    } catch (err) {
      setApiError(mapError(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="booking-create-dialog">
        <DialogHeader>
          <DialogTitle>代预约</DialogTitle>
          <DialogDescription>为学员预约 scheduled 状态的场次。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="booking-learner">学员 *</Label>
            <select
              id="booking-learner"
              className={selectCls}
              value={learnerId}
              onChange={(e) => setLearnerId(Number(e.target.value))}
              data-testid="booking-learner-select"
            >
              <option value={0}>请选择学员</option>
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nickname || l.phone || `#${l.id}`}
                  {l.phone ? `（${l.phone}）` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-session">场次 *</Label>
            <select
              id="booking-session"
              className={selectCls}
              value={sessionId}
              onChange={(e) => setSessionId(Number(e.target.value))}
              data-testid="booking-session-select"
            >
              <option value={0}>请选择场次</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.course_title} · {fmt(s.starts_at)} · {s.location_name}（
                  {s.booked_count}/{s.capacity}）
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>权益</Label>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ent-mode"
                  checked={mode === 'auto'}
                  onChange={() => setMode('auto')}
                  data-testid="booking-mode-auto"
                />
                自动选择
              </label>
              {mode === 'auto' && (
                <div className="ml-6 text-xs text-muted-foreground">
                  {!learnerId || !sessionId
                    ? '选择学员和场次后显示将使用的权益'
                    : usableQuery.isLoading
                      ? '加载可用权益...'
                      : autoPick
                        ? `将使用「${autoPick.product_name}」（${remainText(autoPick)}）`
                        : '该学员对该场次无可用权益，请改用手动指定或无权益占位'}
                </div>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ent-mode"
                  checked={mode === 'manual'}
                  onChange={() => setMode('manual')}
                  data-testid="booking-mode-manual"
                />
                手动指定
              </label>
              {mode === 'manual' && (
                <div className="ml-6">
                  <select
                    className={selectCls}
                    value={manualId}
                    onChange={(e) => setManualId(Number(e.target.value))}
                    data-testid="booking-manual-select"
                  >
                    <option value={0}>请选择权益</option>
                    {usable.map((u) => (
                      <option key={u.entitlement_id} value={u.entitlement_id}>
                        {u.product_name}（{remainText(u)}）
                      </option>
                    ))}
                  </select>
                  {learnerId > 0 && sessionId > 0 && usable.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      无可用权益可指定
                    </p>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ent-mode"
                  checked={mode === 'none'}
                  onChange={() => setMode('none')}
                  data-testid="booking-mode-none"
                />
                无权益占位
              </label>
              {mode === 'none' && (
                <div className="ml-6">
                  <Textarea
                    placeholder="请填写占位原因（如：待补卡）"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    data-testid="booking-reason"
                  />
                </div>
              )}
            </div>
          </div>

          {apiError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {apiError}
            </p>
          )}
        </div>
        <DialogFooter>
          {isFull && (
            <span className="mr-auto self-center text-xs text-amber-600">
              场次已满
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending || joinWaitlist.isPending}
          >
            取消
          </Button>
          {isFull ? (
            <Button
              type="button"
              onClick={onJoinWaitlist}
              disabled={joinWaitlist.isPending}
              data-testid="booking-join-waitlist"
            >
              {joinWaitlist.isPending ? '加入中...' : '加入候补'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={pending}
              data-testid="booking-submit"
            >
              {pending ? '提交中...' : '确认预约'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
