'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { UsersRound, Plus } from 'lucide-react'
import { useBrandLearners, useDeleteLearner } from '@mini-schedule/api/learners'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { Learner, LearnerStatusFilter } from '@mini-schedule/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { LearnerFormDialog } from '@/components/learners/learner-form-dialog'
import { LearnerStatusToggle } from '@/components/learners/learner-status-toggle'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'
const PAGE_SIZE = 20

const STATUS_LABELS: Record<string, string> = {
  active: '正常',
  frozen: '已冻结',
  inactive: '已停用',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  frozen: 'bg-amber-100 text-amber-800',
  inactive: 'bg-slate-100 text-slate-700',
}

export default function LearnersPage() {
  const { has } = usePermissions()
  const canCreate = has(PERMISSIONS.LEARNER_CREATE)
  const canEdit = has(PERMISSIONS.LEARNER_EDIT)
  const canDelete = has(PERMISSIONS.LEARNER_DELETE)

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<LearnerStatusFilter>('all')
  const [locationFilter, setLocationFilter] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Learner | null>(null)
  const [deleting, setDeleting] = useState<Learner | null>(null)

  const locationsQuery = useBrandLocations(1, 100, 'active')
  const locations = useMemo(
    () => locationsQuery.data?.items ?? [],
    [locationsQuery.data],
  )

  const listQuery = useBrandLearners({
    q: q.trim() || undefined,
    status: statusFilter,
    primary_location_id: locationFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const deleteMutation = useDeleteLearner()

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(learner: Learner) {
    setEditing(learner)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success('学员已删除')
      setDeleting(null)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === ErrorCodes.LEARNER_IN_USE) {
          toast.error('该学员仍有有效权益或未来预约，请先处理后再删除')
          // 弹窗保持打开。
        } else if (err.code === ErrorCodes.LEARNER_NOT_FOUND) {
          toast.error('学员不存在或已被删除')
          setDeleting(null)
        } else {
          toast.error(err.message || '删除失败，请重试')
        }
      } else {
        toast.error('删除失败，请重试')
      }
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">学员管理</h1>
          <p className="text-sm text-muted-foreground">
            管理品牌学员档案。学员档案是发放权益、预约下单的前置主数据。
          </p>
        </div>
        <Hint content={canCreate ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={openCreate}
            disabled={!canCreate}
            data-testid="learner-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            新增学员
          </Button>
        </Hint>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="搜索昵称 / 手机号 / 学号"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          className="sm:max-w-xs"
          data-testid="learner-search"
        />
        <div className="flex items-center gap-2">
          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(Number(e.target.value))
              setPage(1)
            }}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            data-testid="learner-location-filter"
          >
            <option value={0}>全部门店</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as LearnerStatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-32" data-testid="learner-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">正常</SelectItem>
              <SelectItem value="frozen">已冻结</SelectItem>
              <SelectItem value="inactive">已停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="rounded-lg border border-slate-200 bg-white"
        data-testid="learners-table"
      >
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">加载中...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UsersRound className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无学员，点击右上角“新增学员”添加第一个学员
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>昵称</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>学号</TableHead>
                <TableHead>主门店</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((learner) => (
                <TableRow
                  key={learner.id}
                  data-testid="learner-row"
                  data-phone={learner.phone}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/learners/${learner.id}`}
                      className="text-primary hover:underline"
                      data-testid={`learner-detail-link-${learner.id}`}
                    >
                      {learner.nickname || '（未填昵称）'}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {learner.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {learner.learner_no || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {learner.primary_location_name || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {learner.tags.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        learner.tags.map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          >
                            {t.name}
                          </span>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[learner.status] ?? ''
                      }`}
                      data-testid="learner-status-badge"
                    >
                      {STATUS_LABELS[learner.status] ?? learner.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <Hint content={canEdit ? undefined : PERMISSION_DENIED_TOOLTIP}>
                        <button
                          type="button"
                          className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canEdit}
                          onClick={() => openEdit(learner)}
                          data-testid={`learner-edit-${learner.id}`}
                        >
                          编辑
                        </button>
                      </Hint>
                      <LearnerStatusToggle learner={learner} />
                      <Hint content={canDelete ? undefined : PERMISSION_DENIED_TOOLTIP}>
                        <button
                          type="button"
                          className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canDelete}
                          onClick={() => setDeleting(learner)}
                          data-testid={`learner-delete-${learner.id}`}
                        >
                          删除
                        </button>
                      </Hint>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > 0 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            第 {page} / {totalPages} 页 · 共 {total} 名学员
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
      ) : null}

      <LearnerFormDialog
        open={dialogOpen}
        initial={editing}
        locations={locations}
        defaultLocationId={locationFilter || undefined}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除该学员？"
        description={
          deleting ? (
            <span>
              将删除学员「
              <span className="font-medium">
                {deleting.nickname || deleting.phone}
              </span>
              」。仍有有效权益或未来预约时无法删除。
            </span>
          ) : null
        }
        confirmText="删除"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
