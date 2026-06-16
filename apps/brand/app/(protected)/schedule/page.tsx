'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarClock, Plus } from 'lucide-react'
import {
  useBrandClassSessions,
  useCancelClassSession,
} from '@mini-schedule/api/class-sessions'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  ClassSessionListItem,
  ClassSessionStatusFilter,
} from '@mini-schedule/types'
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
import { SessionCreateDialog } from '@/components/schedule/session-create-dialog'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

const STATUS_LABELS: Record<string, string> = {
  scheduled: '已排期',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
}

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-rose-100 text-rose-800',
}

function formatRange(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt)
  const e = new Date(endsAt)
  const d = `${s.getFullYear()}/${s.getMonth() + 1}/${s.getDate()}`
  const t = (x: Date) =>
    `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
  return `${d} ${t(s)}–${t(e)}`
}

export default function SchedulePage() {
  const { has } = usePermissions()
  const canCreate = has(PERMISSIONS.SESSION_CREATE)
  const canCancel = has(PERMISSIONS.SESSION_CANCEL)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] =
    useState<ClassSessionStatusFilter>('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<ClassSessionListItem | null>(
    null,
  )

  const locationsQuery = useBrandLocations(1, 100, 'all')
  const listQuery = useBrandClassSessions({
    page,
    page_size: pageSize,
    status: statusFilter,
    location_id:
      locationFilter === 'all' ? undefined : Number(locationFilter),
  })
  const cancelMutation = useCancelClassSession()

  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const totalPages = useMemo(
    () => (total ? Math.max(1, Math.ceil(total / pageSize)) : 1),
    [total, pageSize],
  )

  async function confirmCancel() {
    if (!cancelTarget) return
    try {
      await cancelMutation.mutateAsync({ id: cancelTarget.id })
      toast.success('场次已取消')
      setCancelTarget(null)
    } catch (e) {
      if (e instanceof ApiErrorClass) {
        if (e.code === ErrorCodes.SESSION_CANCEL_NOT_ALLOWED) {
          toast.error('该场次当前状态不可取消')
        } else if (e.code === ErrorCodes.SESSION_NOT_FOUND) {
          toast.error('场次不存在或已变更')
          setCancelTarget(null)
        } else {
          toast.error(e.message || '取消失败，请重试')
        }
      } else {
        toast.error('取消失败，请重试')
      }
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">排课</h1>
          <p className="text-sm text-muted-foreground">
            基于已发布课程模板创建单场次。同一教练同一时段不可重复排课。
          </p>
        </div>
        <Hint content={canCreate ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={!canCreate}
            data-testid="session-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            排课
          </Button>
        </Hint>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">门店</span>
          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            data-testid="session-location-filter"
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
            onValueChange={(v) => {
              setStatusFilter(v as ClassSessionStatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-32" data-testid="session-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="scheduled">已排期</SelectItem>
              <SelectItem value="in_progress">进行中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="rounded-lg border border-slate-200 bg-white"
        data-testid="sessions-table"
      >
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无场次，点击右上角“排课”创建第一节场次
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>课程</TableHead>
                <TableHead>门店</TableHead>
                <TableHead>资源</TableHead>
                <TableHead>教练</TableHead>
                <TableHead>容量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id} data-testid="session-row">
                  <TableCell className="font-medium">
                    {formatRange(s.starts_at, s.ends_at)}
                  </TableCell>
                  <TableCell>{s.course_title}</TableCell>
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
                    {s.booked_count}/{s.capacity}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status] ?? ''}`}
                      data-testid="session-status-badge"
                    >
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === 'scheduled' || s.status === 'in_progress' ? (
                      <Hint
                        content={canCancel ? undefined : PERMISSION_DENIED_TOOLTIP}
                      >
                        <button
                          type="button"
                          className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canCancel}
                          onClick={() => setCancelTarget(s)}
                          data-testid={`session-cancel-${s.id}`}
                        >
                          取消
                        </button>
                      </Hint>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {total} 节场次 · 第 {page} / {totalPages} 页
          </p>
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
      ) : null}

      <SessionCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="取消该场次？"
        description={
          cancelTarget ? (
            <span>
              将取消「
              <span className="font-medium">{cancelTarget.course_title}</span>」（
              {formatRange(cancelTarget.starts_at, cancelTarget.ends_at)}）。
            </span>
          ) : null
        }
        confirmText="取消场次"
        destructive
        loading={cancelMutation.isPending}
        onCancel={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />
    </div>
  )
}
