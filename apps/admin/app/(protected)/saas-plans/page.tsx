'use client'

import { useState } from 'react'
import { PackagePlus, Power, PowerOff } from 'lucide-react'
import { useCreateSaaSPlan, useSaaSPlans, useUpdateSaaSPlanStatus } from '@mini-schedule/api/admin'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTable } from '@mini-schedule/admin-system/components/data-table'
import { EmptyState } from '@mini-schedule/admin-system/components/empty-state'
import { FilterBar } from '@mini-schedule/admin-system/components/filter-bar'
import { LoadingState } from '@mini-schedule/admin-system/components/loading-state'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { StatusBadge } from '@mini-schedule/admin-system/components/status-badge'
import { ResourceListPage } from '@mini-schedule/admin-system/templates/resource-list-page'
import { getBackofficePagination, getBackofficePaginationLabel } from '@mini-schedule/admin-system/models/pagination'
import type { PageResponse, SaaSPlan } from '@mini-schedule/types'

const statusUi = {
  active: { label: '启用', tone: 'success' as const },
  inactive: { label: '停用', tone: 'neutral' as const },
}

function parseFeatures(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((feature_code) => ({ feature_code, enabled: true }))
}

export default function SaaSPlansPage() {
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [featureText, setFeatureText] = useState('multi_location,advanced_permission,report,waitlist')
  const plansQuery = useSaaSPlans(page, 20, true) as {
    data: PageResponse<SaaSPlan> | undefined
    isLoading: boolean
  }
  const createMutation = useCreateSaaSPlan()
  const statusMutation = useUpdateSaaSPlanStatus()

  const plans = plansQuery.data?.items ?? []
  const activeCount = plans.filter((item) => item.status === 'active').length
  const inactiveCount = plans.filter((item) => item.status === 'inactive').length
  const pagination = getBackofficePagination({
    page: plansQuery.data?.page ?? page,
    totalItems: plansQuery.data?.total,
    pageSize: plansQuery.data?.page_size,
  })

  async function handleCreate(formData: FormData) {
    await createMutation.mutateAsync({
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      monthly_price: String(formData.get('monthly_price') ?? '0'),
      yearly_price: String(formData.get('yearly_price') ?? '0'),
      yearly_discount_pct: String(formData.get('yearly_discount_pct') ?? '') || undefined,
      currency: 'CNY',
      max_locations: Number(formData.get('max_locations') ?? 1),
      max_staff_seats: Number(formData.get('max_staff_seats') ?? 1),
      max_learners: Number(formData.get('max_learners') ?? 1),
      sort_order: Number(formData.get('sort_order') ?? 0),
      features: parseFeatures(featureText),
    })
    setDialogOpen(false)
  }

  return (
    <ResourceListPage
      header={
        <PageHeader
          title="套餐管理"
          description="配置品牌自助购买使用的 SaaS Plan，包含价格、额度和功能快照来源。"
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PackagePlus className="size-4" />
                  新建套餐
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form action={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>新建套餐</DialogTitle>
                    <DialogDescription>套餐停用后不影响已有订阅，但不能被新购。</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="name">套餐名称</Label>
                      <Input id="name" name="name" required minLength={2} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="description">说明</Label>
                      <Input id="description" name="description" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_price">月付价格</Label>
                      <Input id="monthly_price" name="monthly_price" inputMode="decimal" required defaultValue="299.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearly_price">年付价格</Label>
                      <Input id="yearly_price" name="yearly_price" inputMode="decimal" required defaultValue="2990.00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearly_discount_pct">年付折扣%</Label>
                      <Input id="yearly_discount_pct" name="yearly_discount_pct" inputMode="decimal" placeholder="可选" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sort_order">排序</Label>
                      <Input id="sort_order" name="sort_order" type="number" defaultValue="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_locations">Location 数</Label>
                      <Input id="max_locations" name="max_locations" type="number" min="1" required defaultValue="1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_staff_seats">员工席位</Label>
                      <Input id="max_staff_seats" name="max_staff_seats" type="number" min="1" required defaultValue="5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_learners">学员数</Label>
                      <Input id="max_learners" name="max_learners" type="number" min="1" required defaultValue="200" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="features">功能编码</Label>
                      <Input id="features" value={featureText} onChange={(event) => setFeatureText(event.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      取消
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? '创建中...' : '创建'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      }
      filters={
        <FilterBar>
          <div className="flex flex-wrap gap-3">
            <StatusBadge label={`启用 ${activeCount}`} tone="success" />
            <StatusBadge label={`停用 ${inactiveCount}`} tone="neutral" />
          </div>
        </FilterBar>
      }
      content={
        plansQuery.isLoading ? (
          <LoadingState title="正在加载套餐" />
        ) : !plans.length ? (
          <EmptyState title="暂无套餐" description="创建套餐后，品牌公开购买页即可读取启用套餐。" />
        ) : (
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>套餐</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>额度</TableHead>
                  <TableHead>功能</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{plan.name}</div>
                      <div className="max-w-[260px] truncate text-xs text-muted-foreground">{plan.description || '-'}</div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <div>¥{plan.monthly_price}/月</div>
                      <div className="text-xs text-muted-foreground">¥{plan.yearly_price}/年</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">L {plan.max_locations} · 员工 {plan.max_staff_seats} · 学员 {plan.max_learners}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[240px] truncate text-xs text-muted-foreground">
                        {(plan.features ?? []).map((item) => item.feature_code).join(', ') || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={statusUi[plan.status].label} tone={statusUi[plan.status].tone} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate({
                            id: plan.id,
                            status: plan.status === 'active' ? 'inactive' : 'active',
                          })
                        }
                      >
                        {plan.status === 'active' ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                        {plan.status === 'active' ? '停用' : '启用'}
                      </Button>
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
  )
}
