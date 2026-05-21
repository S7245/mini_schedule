'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useBrandCourses, useCreateBrandCourse, useUpdateCourseStatus, useDeleteBrandCourse } from '@mini-schedule/api/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { getBackofficePagination, getBackofficePaginationLabel } from '@mini-schedule/admin-system/models/pagination'
import type { CourseType, CourseDifficulty, Course } from '@mini-schedule/types'

const createCourseSchema = z.object({
  title: z.string().min(2, '标题至少 2 个字符'),
  description: z.string().optional(),
  cover_url: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  type: z.enum(['strength', 'cardio', 'flexibility', 'hiit']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_min: z.coerce.number().min(1, '时长必须大于 0'),
})

type CreateCourseForm = z.infer<typeof createCourseSchema>

const typeLabels: Record<CourseType, string> = {
  strength: '力量训练',
  cardio: '有氧训练',
  flexibility: '柔韧性训练',
  hiit: '高强度间歇',
}

const difficultyLabels: Record<CourseDifficulty, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
}

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800',
}

export default function CoursesPage() {
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading } = useBrandCourses(page, 20) as {
    data: { items: Course[]; total: number; page: number; page_size: number } | undefined
    isLoading: boolean
  }
  const createMutation = useCreateBrandCourse()
  const statusMutation = useUpdateCourseStatus()
  const deleteMutation = useDeleteBrandCourse()
  const pagination = getBackofficePagination({
    page: data?.page ?? page,
    totalItems: data?.total,
    pageSize: data?.page_size,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: '',
      description: '',
      cover_url: '',
      duration_min: 30,
    },
  })

  const onSubmit = async (data: CreateCourseForm) => {
    await createMutation.mutateAsync(data)
    reset()
    setDialogOpen(false)
  }

  return (
    <ProtectedLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">课程管理</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>创建课程</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>创建课程</DialogTitle>
                  <DialogDescription>填写课程信息以发布新课程</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="title">标题</Label>
                    <Input id="title" {...register('title')} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">描述</Label>
                    <Textarea id="description" rows={3} {...register('description')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>类型</Label>
                      <Select onValueChange={(v) => setValue('type', v as CourseType)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(typeLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>难度</Label>
                      <Select onValueChange={(v) => setValue('difficulty', v as CourseDifficulty)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择难度" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(difficultyLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.difficulty && <p className="text-sm text-destructive">{errors.difficulty.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_min">时长（分钟）</Label>
                    <Input id="duration_min" type="number" {...register('duration_min')} />
                    {errors.duration_min && <p className="text-sm text-destructive">{errors.duration_min.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover_url">封面 URL</Label>
                    <Input id="cover_url" placeholder="https://..." {...register('cover_url')} />
                    {errors.cover_url && <p className="text-sm text-destructive">{errors.cover_url.message}</p>}
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
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">加载中...</p>
        ) : !data?.items.length ? (
          <p className="text-muted-foreground">暂无课程</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>难度</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{typeLabels[c.type] ?? c.type}</TableCell>
                    <TableCell>{difficultyLabels[c.difficulty]}</TableCell>
                    <TableCell>{c.duration_min} 分钟</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[c.status]}`}>{statusLabels[c.status]}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/courses/${c.id}`} className="text-primary hover:underline text-sm">
                          查看
                        </Link>
                        {c.status === 'draft' && (
                          <button
                            className="text-green-600 hover:underline text-sm"
                            onClick={() =>
                              statusMutation.mutate({
                                id: c.id,
                                status: 'published',
                              })
                            }
                          >
                            发布
                          </button>
                        )}
                        {c.status === 'published' && (
                          <button
                            className="text-amber-600 hover:underline text-sm"
                            onClick={() =>
                              statusMutation.mutate({
                                id: c.id,
                                status: 'archived',
                              })
                            }
                          >
                            下架
                          </button>
                        )}
                        <button
                          className="text-destructive hover:underline text-sm"
                          onClick={() => {
                            if (confirm('确定删除此课程？')) {
                              deleteMutation.mutate(c.id)
                            }
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">{getBackofficePaginationLabel(pagination)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!pagination.canGoPrevious} onClick={() => setPage((p) => p - 1)}>
                  上一页
                </Button>
                <Button variant="outline" size="sm" disabled={!pagination.canGoNext} onClick={() => setPage((p) => p + 1)}>
                  下一页
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  )
}
