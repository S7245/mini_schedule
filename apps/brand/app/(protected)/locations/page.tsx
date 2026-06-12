'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Store } from 'lucide-react'
import {
  useBrandLocations,
  useDeleteBrandLocation,
} from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { Location, LocationStatusFilter } from '@mini-schedule/types'
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
import { LocationFormDialog } from '@/components/locations/location-form-dialog'
import { LocationStatusToggle } from '@/components/locations/location-status-toggle'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

const STATUS_LABELS: Record<string, string> = {
  active: '启用',
  inactive: '停用',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-700',
}

export default function LocationsPage() {
  const { has } = usePermissions()
  const canCreate = has(PERMISSIONS.LOCATION_CREATE)
  const canEdit = has(PERMISSIONS.LOCATION_EDIT)
  const canDelete = has(PERMISSIONS.LOCATION_DELETE)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<LocationStatusFilter>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)

  const listQuery = useBrandLocations(page, pageSize, statusFilter)
  const deleteMutation = useDeleteBrandLocation()

  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0

  const totalPages = useMemo(() => {
    if (!total) return 1
    return Math.max(1, Math.ceil(total / pageSize))
  }, [total, pageSize])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('门店已删除')
      setDeleteTarget(null)
    } catch (e) {
      if (e instanceof ApiErrorClass) {
        switch (e.code) {
          case ErrorCodes.LOCATION_NOT_FOUND:
            toast.error('门店不存在或已删除')
            break
          default:
            toast.error(e.message || '删除失败，请重试')
        }
      } else {
        toast.error('删除失败，请重试')
      }
      // 门店已被他处删除时重试无意义，关闭弹窗（与 roles 页一致）。
      if (e instanceof ApiErrorClass && e.code === ErrorCodes.LOCATION_NOT_FOUND) {
        setDeleteTarget(null)
      }
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">门店管理</h1>
          <p className="text-sm text-muted-foreground">
            管理品牌旗下门店。门店是排课与小程序展示的基础，停用后将不再对外可见。
          </p>
        </div>
        <Hint content={canCreate ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={openCreate}
            disabled={!canCreate}
            data-testid="location-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            新建门店
          </Button>
        </Hint>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">状态</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as LocationStatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger
              className="w-32"
              data-testid="location-status-filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="inactive">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="rounded-lg border border-slate-200 bg-white"
        data-testid="locations-table"
      >
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无门店，点击右上角"新建门店"添加第一个门店
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>电话</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((loc) => (
                <TableRow
                  key={loc.id}
                  data-testid="location-row"
                  data-name={loc.name}
                >
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {loc.address || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {loc.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[loc.status] ?? ''
                      }`}
                      data-testid="location-status-badge"
                    >
                      {STATUS_LABELS[loc.status] ?? loc.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <Hint
                        content={canEdit ? undefined : PERMISSION_DENIED_TOOLTIP}
                      >
                        <button
                          type="button"
                          className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canEdit}
                          onClick={() => openEdit(loc)}
                          data-testid={`location-edit-${loc.id}`}
                        >
                          编辑
                        </button>
                      </Hint>
                      <LocationStatusToggle location={loc} />
                      <Hint
                        content={canDelete ? undefined : PERMISSION_DENIED_TOOLTIP}
                      >
                        <button
                          type="button"
                          className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canDelete}
                          onClick={() => setDeleteTarget(loc)}
                          data-testid={`location-delete-${loc.id}`}
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

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {total} 个门店 · 第 {page} / {totalPages} 页
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

      <LocationFormDialog
        open={dialogOpen}
        initial={editing}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除该门店？"
        description={
          deleteTarget ? (
            <span>
              将删除门店「<span className="font-medium">{deleteTarget.name}</span>
              」。删除后可在配额内重新创建同名门店。
            </span>
          ) : null
        }
        confirmText="删除"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
