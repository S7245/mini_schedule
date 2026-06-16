'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarRange, Plus } from 'lucide-react'
import {
  useBrandRecurringSchedule,
  useBrandRecurringSchedules,
  useCancelRecurringSchedule,
} from '@mini-schedule/api/recurring-schedules'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  RecurringSchedule,
  RecurringScheduleStatusFilter,
} from '@mini-schedule/types'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { RecurringCreateDialog } from '@/components/schedule/recurring-create-dialog'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const STATUS_LABELS: Record<string, string> = {
  active: '进行中',
  cancelled: '已取消',
  completed: '已结束',
}
const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  cancelled: 'bg-rose-100 text-rose-800',
  completed: 'bg-slate-100 text-slate-700',
}

function weekdaysText(weekdays: number[]): string {
  if (!weekdays?.length) return '—'
  return [...weekdays]
    .sort((a, b) => a - b)
    .map((w) => `周${WEEKDAY_LABELS[w]}`)
    .join('、')
}

function rangeText(s: RecurringSchedule): string {
  if (s.end_date) return `${s.start_date} ~ ${s.end_date}`
  if (s.repeat_weeks) return `${s.start_date} 起 ${s.repeat_weeks} 周`
  return s.start_date
}

function formatSessionTime(startsAt: string, endsAt: string): string {
  const a = new Date(startsAt)
  const b = new Date(endsAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${a.getFullYear()}/${a.getMonth() + 1}/${a.getDate()} ${pad(a.getHours())}:${pad(a.getMinutes())}–${pad(b.getHours())}:${pad(b.getMinutes())}`
}

export function RecurringTab() {
  const { has } = usePermissions()
  const canCreate = has(PERMISSIONS.SESSION_CREATE)
  const canCancel = has(PERMISSIONS.SESSION_CANCEL)

  const [statusFilter, setStatusFilter] =
    useState<RecurringScheduleStatusFilter>('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<RecurringSchedule | null>(
    null,
  )

  const locationsQuery = useBrandLocations(1, 100, 'all')
  const listQuery = useBrandRecurringSchedules({
    page: 1,
    page_size: 100,
    status: statusFilter,
    location_id: locationFilter === 'all' ? undefined : Number(locationFilter),
  })
  const cancelMutation = useCancelRecurringSchedule()
  const detailQuery = useBrandRecurringSchedule(detailId)

  const items = listQuery.data?.items ?? []
  const detail = detailQuery.data

  async function confirmCancel() {
    if (!cancelTarget) return
    try {
      await cancelMutation.mutateAsync(cancelTarget.id)
      toast.success('循环排课已取消（已生成的场次不受影响）')
      setCancelTarget(null)
    } catch (e) {
      if (e instanceof ApiErrorClass) {
        if (e.code === ErrorCodes.RECURRING_CANCEL_NOT_ALLOWED) {
          toast.error('该循环排课当前状态不可取消')
        } else if (e.code === ErrorCodes.RECURRING_NOT_FOUND) {
          toast.error('循环排课不存在或已变更')
          setCancelTarget(null)
        } else {
          toast.error(e.message || '取消失败，请重试')
        }
      } else {
        toast.error('取消失败，请重试')
      }
    }
  }

  const cancelDetail = useMemo(() => detail?.recurring_schedule, [detail])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          每周重复批量生成场次。取消循环排课仅停用模板，已生成的场次不会被取消。
        </p>
        <Hint content={canCreate ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={!canCreate}
            data-testid="recurring-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            循环排课
          </Button>
        </Hint>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">门店</span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            data-testid="recurring-location-filter"
          >
            <option value="all">全部</option>
            {(locationsQuery.data?.items ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">状态</span>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as RecurringScheduleStatusFilter)
            }
          >
            <SelectTrigger className="w-32" data-testid="recurring-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">进行中</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="completed">已结束</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="rounded-lg border border-slate-200 bg-white"
        data-testid="recurring-table"
      >
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无循环排课，点击右上角“循环排课”批量生成场次
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程</TableHead>
                <TableHead>门店</TableHead>
                <TableHead>资源</TableHead>
                <TableHead>教练</TableHead>
                <TableHead>周几</TableHead>
                <TableHead>区间</TableHead>
                <TableHead>时段</TableHead>
                <TableHead>已生成</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id} data-testid="recurring-row">
                  <TableCell className="font-medium">{s.course_title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.location_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.resource_name || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.instructor_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {weekdaysText(s.weekdays)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {rangeText(s)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.start_time} · {s.duration_min}分
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.session_count}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status] ?? ''}`}
                      data-testid="recurring-status-badge"
                    >
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setDetailId(s.id)}
                        data-testid={`recurring-detail-${s.id}`}
                      >
                        详情
                      </button>
                      {s.status === 'active' ? (
                        <Hint
                          content={
                            canCancel ? undefined : PERMISSION_DENIED_TOOLTIP
                          }
                        >
                          <button
                            type="button"
                            className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                            disabled={!canCancel}
                            onClick={() => setCancelTarget(s)}
                            data-testid={`recurring-cancel-${s.id}`}
                          >
                            取消
                          </button>
                        </Hint>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RecurringCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* 详情 */}
      <Dialog
        open={detailId !== null}
        onOpenChange={(o) => !o && setDetailId(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>循环排课详情</DialogTitle>
            <DialogDescription>
              {cancelDetail
                ? `${cancelDetail.course_title} · ${cancelDetail.location_name} · ${weekdaysText(cancelDetail.weekdays)} · ${cancelDetail.start_time}`
                : '加载中...'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto" data-testid="recurring-detail-sessions">
            {detailQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                加载中...
              </p>
            ) : (detail?.sessions ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                暂无已生成场次
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>容量</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(detail?.sessions ?? []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        {formatSessionTime(s.starts_at, s.ends_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.booked_count}/{s.capacity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.status}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="取消该循环排课？"
        description="仅停用该循环模板，已生成的场次不会被取消；如需取消具体场次，请到「单场次」逐个操作。"
        confirmText="取消循环排课"
        destructive
        loading={cancelMutation.isPending}
        onCancel={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />
    </div>
  )
}
