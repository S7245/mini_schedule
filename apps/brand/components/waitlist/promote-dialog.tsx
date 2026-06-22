'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useUsableEntitlements } from '@mini-schedule/api/bookings'
import { usePromoteWaitlist } from '@mini-schedule/api/waitlist'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { EntitlementMode, WaitlistEntry } from '@mini-schedule/types'
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

const selectCls =
  'h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

function mapError(err: unknown): string {
  if (err instanceof ApiErrorClass) {
    switch (err.code) {
      case ErrorCodes.SESSION_FULL:
        return '场次已满，需先有人取消才能转正'
      case ErrorCodes.WAITLIST_NOT_PROMOTABLE:
        return '该候补当前不可转正'
      case ErrorCodes.BOOKING_FREQUENCY_EXCEEDED:
        return '超过预约频次上限'
      case ErrorCodes.ENTITLEMENT_NONE_AVAILABLE:
        return '该学员无可用权益，请改用手动指定或无权益占位'
      case ErrorCodes.ENTITLEMENT_NOT_USABLE:
        return '所选权益不可用（已过期/耗尽/冻结）'
      case ErrorCodes.ENTITLEMENT_SCOPE_MISMATCH:
        return '所选权益不适用于该场次'
      case ErrorCodes.ASSISTED_REASON_REQUIRED:
        return '无权益占位须填写原因'
      default:
        return err.message || '转正失败，请重试'
    }
  }
  return '转正失败，请重试'
}

export interface PromoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: WaitlistEntry | null
}

export function PromoteDialog({ open, onOpenChange, entry }: PromoteDialogProps) {
  const promote = usePromoteWaitlist()
  const [mode, setMode] = useState<EntitlementMode>('auto')
  const [manualId, setManualId] = useState(0)
  const [reason, setReason] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const usableQuery = useUsableEntitlements(
    open && entry ? entry.class_session_id : null,
    open && entry ? entry.brand_learner_profile_id : null,
  )
  const usable = useMemo(() => usableQuery.data ?? [], [usableQuery.data])
  const autoPick = usable.find((u) => u.auto_selected) ?? usable[0]

  useEffect(() => {
    if (!open) return
    setMode('auto')
    setManualId(0)
    setReason('')
    setApiError(null)
  }, [open])

  function remainText(u: { remaining_credits: number | null }): string {
    return u.remaining_credits === null ? '不限次' : `剩 ${u.remaining_credits} 次`
  }

  async function onSubmit() {
    if (!entry) return
    setApiError(null)
    if (mode === 'manual' && !manualId) {
      setApiError('请选择要使用的权益')
      return
    }
    if (mode === 'none' && !reason.trim()) {
      setApiError('无权益占位须填写原因')
      return
    }
    try {
      await promote.mutateAsync({
        id: entry.id,
        input: {
          entitlement_mode: mode,
          learner_entitlement_id: mode === 'manual' ? manualId : undefined,
          no_entitlement_reason: mode === 'none' ? reason.trim() : undefined,
        },
      })
      toast.success('已转正')
      onOpenChange(false)
    } catch (err) {
      setApiError(mapError(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="waitlist-promote-dialog">
        <DialogHeader>
          <DialogTitle>转正候补</DialogTitle>
          <DialogDescription>
            {entry ? `为「${entry.learner_name || entry.learner_phone}」创建预约并锁定权益。` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2 text-sm">
          <Label>权益</Label>
          <label className="flex items-center gap-2">
            <input type="radio" name="promote-mode" checked={mode === 'auto'} onChange={() => setMode('auto')} />
            自动选择
          </label>
          {mode === 'auto' && (
            <div className="ml-6 text-xs text-muted-foreground">
              {usableQuery.isLoading
                ? '加载可用权益...'
                : autoPick
                  ? `将使用「${autoPick.product_name}」（${remainText(autoPick)}）`
                  : '该学员无可用权益，请改用手动指定或无权益占位'}
            </div>
          )}
          <label className="flex items-center gap-2">
            <input type="radio" name="promote-mode" checked={mode === 'manual'} onChange={() => setMode('manual')} />
            手动指定
          </label>
          {mode === 'manual' && (
            <div className="ml-6">
              <select
                className={selectCls}
                value={manualId}
                onChange={(e) => setManualId(Number(e.target.value))}
                data-testid="promote-manual-select"
              >
                <option value={0}>请选择权益</option>
                {usable.map((u) => (
                  <option key={u.entitlement_id} value={u.entitlement_id}>
                    {u.product_name}（{remainText(u)}）
                  </option>
                ))}
              </select>
            </div>
          )}
          <label className="flex items-center gap-2">
            <input type="radio" name="promote-mode" checked={mode === 'none'} onChange={() => setMode('none')} />
            无权益占位
          </label>
          {mode === 'none' && (
            <div className="ml-6">
              <Textarea
                placeholder="请填写占位原因"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                data-testid="promote-reason"
              />
            </div>
          )}
          {apiError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {apiError}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={promote.isPending}>
            取消
          </Button>
          <Button type="button" onClick={onSubmit} disabled={promote.isPending} data-testid="promote-submit">
            {promote.isPending ? '转正中...' : '确认转正'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
