'use client'

import { useState } from 'react'
import { Ban, Clock3, SlidersHorizontal, Snowflake } from 'lucide-react'
import {
  useBrandSubscriptions,
  useManualRenewBrandSubscription,
  useUpdateBrandSubscriptionLimits,
  useUpdateBrandSubscriptionStatus,
} from '@mini-schedule/api/admin'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTable } from '@mini-schedule/admin-system/components/data-table'
import { EmptyState } from '@mini-schedule/admin-system/components/empty-state'
import { FilterBar } from '@mini-schedule/admin-system/components/filter-bar'
import { LoadingState } from '@mini-schedule/admin-system/components/loading-state'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { StatusBadge } from '@mini-schedule/admin-system/components/status-badge'
import { ResourceListPage } from '@mini-schedule/admin-system/templates/resource-list-page'
import { getBackofficePagination, getBackofficePaginationLabel } from '@mini-schedule/admin-system/models/pagination'
import type { BrandSubscription, BrandSubscriptionStatus, PageResponse } from '@mini-schedule/types'

const statusUi: Record<BrandSubscriptionStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: '正常', tone: 'success' },
  grace_period: { label: '宽限期', tone: 'warning' },
  restricted: { label: '受限', tone: 'danger' },
  frozen: { label: '冻结', tone: 'danger' },
  expired: { label: '过期', tone: 'neutral' },
  cancelled: { label: '取消', tone: 'neutral' },
}

type DialogMode = 'renew' | 'limits' | 'status'

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('zh-CN')
}

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('all')
  const [selected, setSelected] = useState<BrandSubscription | null>(null)
  const [mode, setMode] = useState<DialogMode>('renew')
  const [nextStatus, setNextStatus] = useState<BrandSubscriptionStatus>('active')

  const filters = status === 'all' ? {} : { status }
  const query = useBrandSubscriptions(page, 20, filters) as {
    data: PageResponse<BrandSubscription> | undefined
    isLoading: boolean
  }
  const renewMutation = useManualRenewBrandSubscription()
  const limitsMutation = useUpdateBrandSubscriptionLimits()
  const statusMutation = useUpdateBrandSubscriptionStatus()

  const subscriptions = query.data?.items ?? []
  const pagination = getBackofficePagination({
    page: query.data?.page ?? page,
    totalItems: query.data?.total,
    pageSize: query.data?.page_size,
  })

  function openDialog(subscription: BrandSubscription, nextMode: DialogMode) {
    setSelected(subscription)
    setMode(nextMode)
    setNextStatus(subscription.status === 'frozen' ? 'active' : 'frozen')
  }

  async function handleSubmit(formData: FormData) {
    if (!selected) return
    const reason = String(formData.get('reason') ?? '')
    if (mode === 'renew') {
      await renewMutation.mutateAsync({
        id: selected.id,
        extend_months: Number(formData.get('extend_months') ?? 0),
        extend_days: Number(formData.get('extend_days') ?? 0),
        reason,
      })
    }
    if (mode === 'limits') {
      await limitsMutation.mutateAsync({
        id: selected.id,
        max_locations: Number(formData.get('max_locations') ?? selected.max_locations),
        max_staff_seats: Number(formData.get('max_staff_seats') ?? selected.max_staff_seats),
        max_learners: Number(formData.get('max_learners') ?? selected.max_learners),
        reason,
      })
    }
    if (mode === 'status') {
      await statusMutation.mutateAsync({
        id: selected.id,
        status: nextStatus,
        frozen_reason: String(formData.get('frozen_reason') ?? ''),
        reason,
      })
    }
    setSelected(null)
  }

  const isMutating = renewMutation.isPending || limitsMutation.isPending || statusMutation.isPending

  return (
    <>
      <ResourceListPage
      header={<PageHeader title="订阅管理" description="查看品牌当前订阅，并执行续期、额度调整、冻结和解冻。" />}
      filters={
        <FilterBar>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground">状态</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {Object.entries(statusUi).map(([value, item]) => (
                  <SelectItem key={value} value={value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FilterBar>
      }
      content={
        query.isLoading ? (
          <LoadingState title="正在加载订阅" />
        ) : !subscriptions.length ? (
          <EmptyState title="暂无订阅" description="品牌购买套餐或平台人工补偿后，这里会出现订阅快照。" />
        ) : (
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订阅</TableHead>
                  <TableHead>品牌/套餐</TableHead>
                  <TableHead>周期</TableHead>
                  <TableHead>额度</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-mono text-sm">{subscription.id}</TableCell>
                    <TableCell>
                      <div>Brand #{subscription.brand_id}</div>
                      <div className="text-xs text-muted-foreground">Plan #{subscription.plan_id}</div>
                    </TableCell>
                    <TableCell>{subscription.billing_cycle === 'yearly' ? '年付' : '月付'}</TableCell>
                    <TableCell>
                      L {subscription.max_locations} · 员工 {subscription.max_staff_seats} · 学员 {subscription.max_learners}
                    </TableCell>
                    <TableCell>
                      <div>{formatDate(subscription.starts_at)}</div>
                      <div className="text-xs text-muted-foreground">至 {formatDate(subscription.expires_at)}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={statusUi[subscription.status].label} tone={statusUi[subscription.status].tone} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openDialog(subscription, 'renew')}>
                          <Clock3 className="size-4" />
                          续期
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openDialog(subscription, 'limits')}>
                          <SlidersHorizontal className="size-4" />
                          额度
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openDialog(subscription, 'status')}>
                          {subscription.status === 'frozen' ? <Ban className="size-4" /> : <Snowflake className="size-4" />}
                          {subscription.status === 'frozen' ? '解冻' : '状态'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        )
      }
      footer={
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-sm text-muted-foreground">{getBackofficePaginationLabel(pagination)}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.canGoPrevious} onClick={() => setPage((current) => current - 1)}>
              上一页
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.canGoNext} onClick={() => setPage((current) => current + 1)}>
              下一页
            </Button>
          </div>
        </div>
      }
      />

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <form action={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {mode === 'renew' ? '手动续期' : mode === 'limits' ? '调整额度' : '调整订阅状态'}
              </DialogTitle>
              <DialogDescription>所有手动调整都会写入操作日志。</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {mode === 'renew' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="extend_months">续期月份</Label>
                    <Input id="extend_months" name="extend_months" type="number" min="0" defaultValue="1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extend_days">续期天数</Label>
                    <Input id="extend_days" name="extend_days" type="number" min="0" defaultValue="0" />
                  </div>
                </div>
              ) : null}

              {mode === 'limits' && selected ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="max_locations">Location 数</Label>
                    <Input id="max_locations" name="max_locations" type="number" min="1" defaultValue={selected.max_locations} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_staff_seats">员工席位</Label>
                    <Input id="max_staff_seats" name="max_staff_seats" type="number" min="1" defaultValue={selected.max_staff_seats} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_learners">学员数</Label>
                    <Input id="max_learners" name="max_learners" type="number" min="1" defaultValue={selected.max_learners} />
                  </div>
                </div>
              ) : null}

              {mode === 'status' ? (
                <div className="space-y-2">
                  <Label>状态</Label>
                  <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as BrandSubscriptionStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusUi).map(([value, item]) => (
                        <SelectItem key={value} value={value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {nextStatus === 'frozen' ? (
                    <Input name="frozen_reason" className="mt-3" placeholder="冻结原因" required />
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="reason">操作原因</Label>
                <Input id="reason" name="reason" required maxLength={1000} placeholder="用于 OperationLog 审计" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                取消
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating ? '提交中...' : '提交'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
