'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Wallet, Plus } from 'lucide-react'
import {
  useBrandEntitlementProducts,
  useUpdateEntitlementProductStatus,
} from '@mini-schedule/api/entitlement-products'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type {
  EntitlementProduct,
  EntitlementProductStatusFilter,
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
  EntitlementProductFormDialog,
  PRODUCT_TYPE_LABELS,
} from '@/components/entitlements/entitlement-product-form-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-700',
}

function creditsLabel(p: EntitlementProduct): string {
  if (p.total_credits === null) return '不限次'
  return `${p.total_credits} 次`
}

function limitsLabel(p: EntitlementProduct): string {
  const parts: string[] = []
  if (p.daily_booking_limit) parts.push(`日${p.daily_booking_limit}`)
  if (p.weekly_booking_limit) parts.push(`周${p.weekly_booking_limit}`)
  if (p.monthly_booking_limit) parts.push(`月${p.monthly_booking_limit}`)
  if (p.concurrent_booking_limit) parts.push(`同时${p.concurrent_booking_limit}`)
  return parts.length ? parts.join(' / ') : '不限'
}

function scopeLabel(p: EntitlementProduct): string {
  const loc = p.location_scope === 'all' ? '全部门店' : `${p.location_ids.length} 门店`
  const course = p.course_scope === 'all' ? '全部课程' : `${p.course_ids.length} 课程`
  return `${loc} · ${course}`
}

export default function EntitlementProductsPage() {
  const { has } = usePermissions()
  const canManage = has(PERMISSIONS.ENTITLEMENT_MANAGE)

  const [statusFilter, setStatusFilter] = useState<EntitlementProductStatusFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EntitlementProduct | null>(null)

  const listQuery = useBrandEntitlementProducts({
    status: statusFilter,
    page: 1,
    page_size: 100,
  })
  const items = listQuery.data?.items ?? []
  const statusMutation = useUpdateEntitlementProductStatus()

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function toggleStatus(p: EntitlementProduct) {
    const next = p.status === 'active' ? 'inactive' : 'active'
    try {
      await statusMutation.mutateAsync({ id: p.id, status: next })
      toast.success(next === 'active' ? '产品已启用' : '产品已停用')
    } catch (err) {
      toast.error(err instanceof ApiErrorClass ? err.message : '状态切换失败')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">权益产品</h1>
          <p className="text-sm text-muted-foreground">
            定义可发放给学员的权益模板（次数/课时包、单次体验包、会员卡）。停用后不可再发放。
          </p>
        </div>
        <Hint content={canManage ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button onClick={openCreate} disabled={!canManage} data-testid="product-create-button">
            <Plus className="mr-1 h-4 w-4" />
            新增产品
          </Button>
        </Hint>
      </div>

      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EntitlementProductStatusFilter)}>
          <SelectTrigger className="w-32" data-testid="product-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white" data-testid="products-table">
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">加载中...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无权益产品，点击右上角“新增产品”创建第一个
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>次数 / 有效期</TableHead>
                <TableHead>频次上限</TableHead>
                <TableHead>适用范围</TableHead>
                <TableHead>已发放</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id} data-testid="product-row" data-name={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {PRODUCT_TYPE_LABELS[p.product_type]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {creditsLabel(p)} / {p.validity_days} 天
                  </TableCell>
                  <TableCell className="text-muted-foreground">{limitsLabel(p)}</TableCell>
                  <TableCell className="text-muted-foreground">{scopeLabel(p)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.issued_count}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[p.status] ?? ''
                      }`}
                      data-testid="product-status-badge"
                    >
                      {p.status === 'active' ? '启用' : '停用'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <Hint content={canManage ? undefined : PERMISSION_DENIED_TOOLTIP}>
                        <button
                          type="button"
                          className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canManage}
                          onClick={() => {
                            setEditing(p)
                            setDialogOpen(true)
                          }}
                          data-testid={`product-edit-${p.id}`}
                        >
                          编辑
                        </button>
                      </Hint>
                      <Hint content={canManage ? undefined : PERMISSION_DENIED_TOOLTIP}>
                        <button
                          type="button"
                          className="text-amber-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canManage || statusMutation.isPending}
                          onClick={() => toggleStatus(p)}
                          data-testid={`product-toggle-${p.id}`}
                        >
                          {p.status === 'active' ? '停用' : '启用'}
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

      <EntitlementProductFormDialog open={dialogOpen} initial={editing} onOpenChange={setDialogOpen} />
    </div>
  )
}
