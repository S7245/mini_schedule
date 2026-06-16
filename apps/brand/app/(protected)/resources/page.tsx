'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Boxes, Plus } from 'lucide-react'
import {
  useBrandLocationResources,
  useDeleteLocationResource,
} from '@mini-schedule/api/location-resources'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  LocationResource,
  LocationResourceStatusFilter,
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
import {
  RESOURCE_TYPE_LABELS,
  ResourceFormDialog,
} from '@/components/resources/resource-form-dialog'
import { ResourceStatusToggle } from '@/components/resources/resource-status-toggle'
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

export default function ResourcesPage() {
  const { has } = usePermissions()
  const canCreate = has(PERMISSIONS.LOCATION_RESOURCE_CREATE)
  const canEdit = has(PERMISSIONS.LOCATION_RESOURCE_EDIT)
  const canDelete = has(PERMISSIONS.LOCATION_RESOURCE_DELETE)

  const [locationId, setLocationId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] =
    useState<LocationResourceStatusFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LocationResource | null>(null)
  const [deleting, setDeleting] = useState<LocationResource | null>(null)

  const locationsQuery = useBrandLocations(1, 100, 'active')
  const locations = useMemo(
    () => locationsQuery.data?.items ?? [],
    [locationsQuery.data],
  )

  // 默认选中第一个 active 门店（一次性）。
  useEffect(() => {
    if (locationId === null && locations.length > 0) {
      setLocationId(locations[0].id)
    }
  }, [locations, locationId])

  const listQuery = useBrandLocationResources(
    {
      location_id: locationId ?? 0,
      status: statusFilter,
      page: 1,
      page_size: 100,
    },
    locationId !== null,
  )
  const items = listQuery.data?.items ?? []
  const deleteMutation = useDeleteLocationResource()

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(resource: LocationResource) {
    setEditing(resource)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success('资源已删除')
      setDeleting(null)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === ErrorCodes.RESOURCE_IN_USE) {
          toast.error('该资源仍被未结束场次或循环排课占用，请先取消后再删除')
          // 弹窗保持打开，便于用户调整。
        } else if (err.code === ErrorCodes.RESOURCE_NOT_FOUND) {
          toast.error('资源不存在或已被删除')
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
          <h1 className="text-xl font-semibold tracking-tight">资源管理</h1>
          <p className="text-sm text-muted-foreground">
            管理门店下可被排课占用的资源（教室/场地/线上/设备）。停用后不可用于新排课。
          </p>
        </div>
        <Hint content={canCreate ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={openCreate}
            disabled={!canCreate || locations.length === 0}
            data-testid="resource-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            新增资源
          </Button>
        </Hint>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">门店</span>
          <select
            value={locationId ?? ''}
            onChange={(e) => setLocationId(Number(e.target.value))}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            data-testid="resource-location-filter"
          >
            {locations.length === 0 ? (
              <option value="">暂无启用门店</option>
            ) : null}
            {locations.map((l) => (
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
              setStatusFilter(v as LocationResourceStatusFilter)
            }
          >
            <SelectTrigger className="w-32" data-testid="resource-status-filter">
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
        data-testid="resources-table"
      >
        {locations.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            暂无启用门店，请先到「门店管理」创建门店。
          </p>
        ) : listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              该门店暂无资源，点击右上角“新增资源”添加第一个资源
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>容量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((res) => (
                <TableRow
                  key={res.id}
                  data-testid="resource-row"
                  data-name={res.name}
                >
                  <TableCell className="font-medium">{res.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {RESOURCE_TYPE_LABELS[res.type] ?? res.type}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {res.capacity}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[res.status] ?? ''
                      }`}
                      data-testid="resource-status-badge"
                    >
                      {STATUS_LABELS[res.status] ?? res.status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {res.remark || '—'}
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
                          onClick={() => openEdit(res)}
                          data-testid={`resource-edit-${res.id}`}
                        >
                          编辑
                        </button>
                      </Hint>
                      <ResourceStatusToggle resource={res} />
                      <Hint
                        content={canDelete ? undefined : PERMISSION_DENIED_TOOLTIP}
                      >
                        <button
                          type="button"
                          className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canDelete}
                          onClick={() => setDeleting(res)}
                          data-testid={`resource-delete-${res.id}`}
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

      <ResourceFormDialog
        open={dialogOpen}
        initial={editing}
        locations={locations}
        defaultLocationId={locationId ?? undefined}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除该资源？"
        description={
          deleting ? (
            <span>
              将删除资源「
              <span className="font-medium">{deleting.name}</span>
              」。被未结束场次或循环排课占用时无法删除。
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
