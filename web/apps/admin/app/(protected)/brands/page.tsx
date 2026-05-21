'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useBrands, useCreateBrand, useUpdateBrandStatus } from '@mini-schedule/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResourceListPage } from '@mini-schedule/admin-system/templates/resource-list-page'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { StatusBadge } from '@mini-schedule/admin-system/components/status-badge'
import { EmptyState } from '@mini-schedule/admin-system/components/empty-state'
import { DataTable } from '@mini-schedule/admin-system/components/data-table'
import { LoadingState } from '@mini-schedule/admin-system/components/loading-state'
import { FilterBar } from '@mini-schedule/admin-system/components/filter-bar'
import type { Brand, BrandStatus, PageResponse } from '@mini-schedule/types'

const createBrandSchema = z.object({
  name: z.string().min(2, '名称至少 2 个字符'),
  logo_url: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  contact_name: z.string().min(2, '联系人至少 2 个字符'),
  contact_phone: z.string().min(1, '请输入联系电话'),
})

type CreateBrandForm = z.infer<typeof createBrandSchema>

const statusUi: Record<BrandStatus, { label: string; tone: 'success' | 'danger' | 'warning' }> = {
  active: { label: '已启用', tone: 'success' },
  suspended: { label: '已停用', tone: 'danger' },
  pending: { label: '待审核', tone: 'warning' },
}

export default function BrandsPage() {
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading } = useBrands(page, 20) as {
    data: PageResponse<Brand> | undefined
    isLoading: boolean
  }
  const createMutation = useCreateBrand()
  const statusMutation = useUpdateBrandStatus()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateBrandForm>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: { name: '', logo_url: '', contact_name: '', contact_phone: '' },
  })

  const onSubmit = async (formData: CreateBrandForm) => {
    await createMutation.mutateAsync(formData)
    reset()
    setDialogOpen(false)
  }

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1

  return (
    <ResourceListPage
      header={
        <PageHeader
          title="品牌管理"
          description="管理平台品牌入驻、启用状态和品牌详情。"
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button>创建品牌</Button></DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>创建品牌</DialogTitle>
                    <DialogDescription>填写品牌信息以创建新品牌</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">品牌名称</Label>
                      <Input id="name" {...register('name')} />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">联系人</Label>
                      <Input id="contact_name" {...register('contact_name')} />
                      {errors.contact_name && <p className="text-sm text-destructive">{errors.contact_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">联系电话</Label>
                      <Input id="contact_phone" {...register('contact_phone')} />
                      {errors.contact_phone && <p className="text-sm text-destructive">{errors.contact_phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input id="logo_url" placeholder="https://..." {...register('logo_url')} />
                      {errors.logo_url && <p className="text-sm text-destructive">{errors.logo_url.message}</p>}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                    <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? '创建中...' : '创建'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      }
      filters={
        <FilterBar>
          <p className="text-sm text-slate-500">共 {data?.total ?? 0} 个品牌，支持创建、查看与状态变更。</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">导出列表</Button>
          </div>
        </FilterBar>
      }
      content={
        isLoading ? (
          <LoadingState title="正在加载品牌列表" />
        ) : !data?.items.length ? (
          <EmptyState title="暂无品牌" description="创建第一个品牌后，这里会出现品牌列表。" />
        ) : (
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-mono text-sm">{brand.id}</TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell>{brand.contact_name ?? '-'}</TableCell>
                    <TableCell>{brand.contact_phone ?? '-'}</TableCell>
                    <TableCell>
                      <StatusBadge label={statusUi[brand.status].label} tone={statusUi[brand.status].tone} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/brands/${brand.id}`} className="text-sm text-primary hover:underline">
                          查看
                        </Link>
                        {brand.status === 'pending' ? (
                          <button
                            type="button"
                            className="text-sm text-green-600 hover:underline"
                            onClick={() => statusMutation.mutate({ id: brand.id, status: 'active' })}
                          >
                            启用
                          </button>
                        ) : null}
                        {brand.status === 'active' ? (
                          <button
                            type="button"
                            className="text-sm text-amber-600 hover:underline"
                            onClick={() => statusMutation.mutate({ id: brand.id, status: 'suspended' })}
                          >
                            停用
                          </button>
                        ) : null}
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
          <p className="text-sm text-slate-500">
            共 {data?.total ?? 0} 条，第 {page} 页 / 共 {totalPages} 页
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
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
