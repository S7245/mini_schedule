'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useSessionWaitlist,
  useSkipWaitlist,
  useCancelWaitlist,
} from '@mini-schedule/api/waitlist'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type { WaitlistEntry, WaitlistStatus } from '@mini-schedule/types'
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
import { PromoteDialog } from '@/components/waitlist/promote-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const DENIED = '权限不足，请联系管理员'

const STATUS_LABELS: Record<WaitlistStatus, string> = {
  waiting: '候补中',
  eligible_to_promote: '可转正',
  promoted: '已转正',
  cancelled: '已取消',
  skipped: '已跳过',
}

const STATUS_BADGE: Record<WaitlistStatus, string> = {
  waiting: 'bg-amber-100 text-amber-800',
  eligible_to_promote: 'bg-sky-100 text-sky-800',
  promoted: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-600',
  skipped: 'bg-slate-100 text-slate-600',
}

export interface WaitlistSessionRef {
  id: number
  course_title: string
  booked_count: number
  capacity: number
}

export interface WaitlistDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: WaitlistSessionRef | null
}

export function WaitlistDrawer({ open, onOpenChange, session }: WaitlistDrawerProps) {
  const { has } = usePermissions()
  const canPromote = has(PERMISSIONS.BOOKING_CREATE_ASSISTED)
  const canCancel = has(PERMISSIONS.BOOKING_CANCEL)
  const isFull = session ? session.booked_count >= session.capacity : true

  const query = useSessionWaitlist(open && session ? session.id : null)
  const entries = query.data ?? []
  const skipMutation = useSkipWaitlist()
  const cancelMutation = useCancelWaitlist()

  const [promoteTarget, setPromoteTarget] = useState<WaitlistEntry | null>(null)
  const [skipTarget, setSkipTarget] = useState<WaitlistEntry | null>(null)
  const [skipReason, setSkipReason] = useState('')
  const [cancelTarget, setCancelTarget] = useState<WaitlistEntry | null>(null)

  async function confirmSkip() {
    if (!skipTarget) return
    try {
      await skipMutation.mutateAsync({ id: skipTarget.id, reason: skipReason.trim() })
      toast.success('已跳过')
      setSkipTarget(null)
      setSkipReason('')
    } catch (err) {
      toast.error(err instanceof ApiErrorClass ? err.message : '操作失败')
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    try {
      await cancelMutation.mutateAsync({ id: cancelTarget.id })
      toast.success('已取消候补')
      setCancelTarget(null)
    } catch (err) {
      toast.error(err instanceof ApiErrorClass ? err.message : '操作失败')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" data-testid="waitlist-drawer">
          <DialogHeader>
            <DialogTitle>候补名单{session ? ` · ${session.course_title}` : ''}</DialogTitle>
            <DialogDescription>
              {session ? `容量 ${session.booked_count}/${session.capacity}` : ''}
              {isFull ? ' · 已满（需有人取消才能转正）' : ' · 有空位，可转正队首'}
            </DialogDescription>
          </DialogHeader>
          {query.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">加载中...</p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无候补</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>学员</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id} data-testid="waitlist-row">
                    <TableCell className="text-muted-foreground">{e.position}</TableCell>
                    <TableCell className="font-medium">
                      {e.learner_name || e.learner_phone || `#${e.brand_learner_profile_id}`}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[e.status]}`}
                      >
                        {STATUS_LABELS[e.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {e.status === 'waiting' || e.status === 'eligible_to_promote' ? (
                        <div className="flex justify-end gap-3 text-sm">
                          <Hint
                            content={
                              !canPromote
                                ? DENIED
                                : isFull
                                  ? '场次已满，需先有人取消'
                                  : undefined
                            }
                          >
                            <button
                              type="button"
                              className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                              disabled={!canPromote || isFull}
                              onClick={() => setPromoteTarget(e)}
                              data-testid="waitlist-promote"
                            >
                              转正
                            </button>
                          </Hint>
                          <Hint content={canPromote ? undefined : DENIED}>
                            <button
                              type="button"
                              className="text-muted-foreground hover:underline disabled:cursor-not-allowed"
                              disabled={!canPromote}
                              onClick={() => {
                                setSkipReason('')
                                setSkipTarget(e)
                              }}
                              data-testid="waitlist-skip"
                            >
                              跳过
                            </button>
                          </Hint>
                          <Hint content={canCancel ? undefined : DENIED}>
                            <button
                              type="button"
                              className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                              disabled={!canCancel}
                              onClick={() => setCancelTarget(e)}
                              data-testid="waitlist-cancel"
                            >
                              取消
                            </button>
                          </Hint>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <PromoteDialog
        open={Boolean(promoteTarget)}
        onOpenChange={(o) => !o && setPromoteTarget(null)}
        entry={promoteTarget}
      />

      <ConfirmDialog
        open={Boolean(skipTarget)}
        title="跳过该候补？"
        description={
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              跳过后该候补将标记为「已跳过」，可转正下一位。
            </p>
            <Textarea
              placeholder="跳过原因（如：无可用权益）"
              value={skipReason}
              onChange={(ev) => setSkipReason(ev.target.value)}
              rows={2}
              data-testid="waitlist-skip-reason"
            />
          </div>
        }
        confirmText="跳过"
        loading={skipMutation.isPending}
        onCancel={() => setSkipTarget(null)}
        onConfirm={confirmSkip}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="取消该候补？"
        description={
          cancelTarget ? (
            <span>
              将移除{' '}
              <span className="font-medium text-foreground">
                {cancelTarget.learner_name || cancelTarget.learner_phone}
              </span>{' '}
              的候补。
            </span>
          ) : undefined
        }
        confirmText="取消候补"
        destructive
        loading={cancelMutation.isPending}
        onCancel={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />
    </>
  )
}
