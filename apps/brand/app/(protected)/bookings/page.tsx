'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CalendarClock, Plus } from 'lucide-react'
import { useBrandBookings, useCancelBooking } from '@mini-schedule/api/bookings'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type { Booking, BookingStatus, BookingStatusFilter } from '@mini-schedule/types'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { BookingCreateDialog } from '@/components/bookings/booking-create-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PAGE_SIZE = 20
const DENIED = '权限不足，请联系管理员'

const STATUS_LABELS: Record<BookingStatus, string> = {
  booked: '已预约',
  cancelled: '已取消',
  attended: '已到课',
  pending_no_show: '待确认爽约',
  no_show: '已爽约',
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  booked: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-600',
  attended: 'bg-sky-100 text-sky-800',
  pending_no_show: 'bg-amber-100 text-amber-800',
  no_show: 'bg-rose-100 text-rose-800',
}

function fmt(ts: string): string {
  return ts ? ts.slice(0, 16).replace('T', ' ') : '—'
}

export default function BookingsPage() {
  const { has } = usePermissions()
  const canCreate = has(PERMISSIONS.BOOKING_CREATE_ASSISTED)
  const canCancel = has(PERMISSIONS.BOOKING_CANCEL)

  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('all')
  const [onlyFix, setOnlyFix] = useState(false)
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelling, setCancelling] = useState<Booking | null>(null)

  const listQuery = useBrandBookings({
    status: statusFilter,
    requires_entitlement_fix: onlyFix || undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cancelMutation = useCancelBooking()

  async function confirmCancel() {
    if (!cancelling) return
    try {
      await cancelMutation.mutateAsync({ id: cancelling.id })
      toast.success('预约已取消')
      setCancelling(null)
    } catch (err) {
      toast.error(err instanceof ApiErrorClass ? err.message : '取消失败，请重试')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">预约管理</h1>
          <p className="text-sm text-muted-foreground">
            员工代预约 / 代取消，处理无权益占位预约。
          </p>
        </div>
        <Hint content={canCreate ? undefined : DENIED}>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={!canCreate}
            data-testid="booking-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            代预约
          </Button>
        </Hint>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as BookingStatusFilter)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-36" data-testid="booking-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="booked">已预约</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
            <SelectItem value="attended">已到课</SelectItem>
            <SelectItem value="pending_no_show">待确认爽约</SelectItem>
            <SelectItem value="no_show">已爽约</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyFix}
            onChange={(e) => {
              setOnlyFix(e.target.checked)
              setPage(1)
            }}
            data-testid="booking-fix-filter"
          />
          仅待补权益
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">加载中...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无预约，点击右上角「代预约」为学员下单
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学员</TableHead>
                <TableHead>课程</TableHead>
                <TableHead>门店</TableHead>
                <TableHead>上课时间</TableHead>
                <TableHead>权益</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b) => (
                <TableRow key={b.id} data-testid="booking-row">
                  <TableCell className="font-medium">
                    <Link
                      href={`/learners/${b.brand_learner_profile_id}`}
                      className="text-primary hover:underline"
                    >
                      {b.learner_name || b.learner_phone || `#${b.brand_learner_profile_id}`}
                    </Link>
                  </TableCell>
                  <TableCell>{b.course_title}</TableCell>
                  <TableCell className="text-muted-foreground">{b.location_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {fmt(b.session_starts_at)}
                  </TableCell>
                  <TableCell>
                    {b.hold ? (
                      <span className="text-sm">{b.hold.product_name}</span>
                    ) : b.requires_entitlement_fix ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        ⚠ 待补权益
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status]}`}
                    >
                      {STATUS_LABELS[b.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Hint content={canCancel ? undefined : DENIED}>
                      <button
                        type="button"
                        className="text-sm text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                        disabled={!canCancel || b.status !== 'booked'}
                        onClick={() => setCancelling(b)}
                        data-testid="booking-cancel-button"
                      >
                        代取消
                      </button>
                    </Hint>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            第 {page} / {totalPages} 页 · 共 {total} 条预约
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      <BookingCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="代取消该预约？"
        description={
          cancelling ? (
            <span>
              将取消{' '}
              <span className="font-medium text-foreground">
                {cancelling.learner_name || cancelling.learner_phone}
              </span>{' '}
              在「{cancelling.course_title}」（{fmt(cancelling.session_starts_at)}）的预约，
              并按规则释放名额与权益。
            </span>
          ) : undefined
        }
        confirmText="代取消"
        destructive
        loading={cancelMutation.isPending}
        onCancel={() => setCancelling(null)}
        onConfirm={confirmCancel}
      />
    </div>
  )
}
