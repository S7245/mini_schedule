'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Download, ShieldCheck } from 'lucide-react'
import { useAdmins, useCreateAdmin } from '@mini-schedule/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResourceListPage } from '@mini-schedule/admin-system/templates/resource-list-page'
import { FilterBar } from '@mini-schedule/admin-system/components/filter-bar'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { StatusBadge } from '@mini-schedule/admin-system/components/status-badge'
import { EmptyState } from '@mini-schedule/admin-system/components/empty-state'
import { LoadingState } from '@mini-schedule/admin-system/components/loading-state'
import { DataTable } from '@mini-schedule/admin-system/components/data-table'
import { getBackofficePagination, getBackofficePaginationLabel } from '@mini-schedule/admin-system/models/pagination'
import type { AdminUser, PageResponse } from '@mini-schedule/types'

const createAdminSchema = z.object({
  username: z.string().min(3, '用户名至少 3 个字符'),
  password: z.string().min(6, '密码至少 6 位'),
  role: z.enum(['super_admin', 'operator', 'support']),
})

type CreateAdminForm = z.infer<typeof createAdminSchema>

const roleLabels: Record<string, string> = {
  super_admin: '超级管理员',
  operator: '运营',
  support: '客服',
}

const roleTone = {
  super_admin: 'neutral' as const,
  operator: 'success' as const,
  support: 'warning' as const,
}

function SummaryBadge({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  )
}

export default function AdminsPage() {
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading } = useAdmins(page, 20) as {
    data: PageResponse<AdminUser> | undefined
    isLoading: boolean
  }
  const createMutation = useCreateAdmin()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateAdminForm>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { username: '', password: '', role: 'operator' },
  })

  const onSubmit = async (formData: CreateAdminForm) => {
    await createMutation.mutateAsync(formData)
    reset()
    setDialogOpen(false)
  }

  const pagination = getBackofficePagination({
    page: data?.page ?? page,
    totalItems: data?.total,
    pageSize: data?.page_size,
  })
  const admins = data?.items ?? []
  const superAdminCount = admins.filter((admin) => admin.role === 'super_admin').length
  const operatorCount = admins.filter((admin) => admin.role === 'operator').length
  const supportCount = admins.filter((admin) => admin.role === 'support').length

  return (
    <ResourceListPage
      header={
        <PageHeader
          title="管理员管理"
          description="管理平台后台账号和角色分配。"
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>创建管理员</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>创建管理员</DialogTitle>
                    <DialogDescription>创建新的平台管理账号</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input id="username" {...register('username')} />
                      {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">密码</Label>
                      <Input id="password" type="password" {...register('password')} />
                      {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>角色</Label>
                      <Select onValueChange={(v) => setValue('role', v as CreateAdminForm['role'])} defaultValue="operator">
                        <SelectTrigger>
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
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
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">当前管理员账号列表，支持角色区分和新增账号。</p>
              <p className="text-xs text-muted-foreground">建议把高权限账号数量保持精简，运营与客服权限单独分层。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SummaryBadge label="超级管理员" value={superAdminCount} />
              <SummaryBadge label="运营" value={operatorCount} />
              <SummaryBadge label="客服" value={supportCount} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 rounded-2xl">
              <ShieldCheck className="size-4" />
              权限检查
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-2xl">
              <Download className="size-4" />
              导出账号
            </Button>
          </div>
        </FilterBar>
      }
      content={
        isLoading ? (
          <LoadingState title="正在加载管理员列表" />
        ) : !data?.items.length ? (
          <EmptyState title="暂无管理员" description="创建第一个管理员账号后，这里会出现列表。" />
        ) : (
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>昵称</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-mono text-sm">{admin.id}</TableCell>
                    <TableCell className="font-medium">{admin.username}</TableCell>
                    <TableCell>{admin.nickname ?? '-'}</TableCell>
                    <TableCell>
                      <StatusBadge label={roleLabels[admin.role] ?? admin.role} tone={roleTone[admin.role]} />
                    </TableCell>
                    <TableCell>{new Date(admin.created_at).toLocaleDateString('zh-CN')}</TableCell>
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
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl"
              disabled={!pagination.canGoPrevious}
              onClick={() => setPage((current) => current - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl"
              disabled={!pagination.canGoNext}
              onClick={() => setPage((current) => current + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      }
    />
  )
}
