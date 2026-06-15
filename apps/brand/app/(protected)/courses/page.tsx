'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { BookOpen, Plus } from 'lucide-react'
import {
  useBrandCourses,
  useDeleteBrandCourse,
  useUpdateBrandCourseStatus,
} from '@mini-schedule/api/courses'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  CourseStatus,
  CourseStatusFilter,
  CourseTemplateListItem,
} from '@mini-schedule/types'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import { Input } from '@/components/ui/input'
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
import { CourseFormDialog } from '@/components/courses/course-form-dialog'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

const STATUS_BADGE: Record<CourseStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-amber-100 text-amber-800',
}

export default function CoursesPage() {
  const { has } = usePermissions()
  const canCreate = has(PERMISSIONS.COURSE_CREATE)
  const canEdit = has(PERMISSIONS.COURSE_EDIT)
  const canDelete = has(PERMISSIONS.COURSE_DELETE)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>('all')
  const [q, setQ] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] =
    useState<CourseTemplateListItem | null>(null)

  const listQuery = useBrandCourses({
    page,
    page_size: pageSize,
    status: statusFilter,
    q: q.trim() || undefined,
  })
  const statusMutation = useUpdateBrandCourseStatus()
  const deleteMutation = useDeleteBrandCourse()

  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const totalPages = useMemo(
    () => (total ? Math.max(1, Math.ceil(total / pageSize)) : 1),
    [total, pageSize],
  )

  async function changeStatus(
    course: CourseTemplateListItem,
    status: CourseStatus,
  ) {
    try {
      await statusMutation.mutateAsync({ id: course.id, status })
      toast.success(
        status === 'published'
          ? '课程已发布'
          : status === 'archived'
            ? '课程已归档'
            : '课程已转为草稿',
      )
    } catch (e) {
      toast.error(e instanceof ApiErrorClass ? e.message : '操作失败，请重试')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('课程模板已删除')
      setDeleteTarget(null)
    } catch (e) {
      if (e instanceof ApiErrorClass) {
        switch (e.code) {
          case ErrorCodes.COURSE_IN_USE:
            toast.error('该课程仍有已排场次，请先取消后再删除')
            break
          case ErrorCodes.COURSE_NOT_FOUND:
            toast.error('课程不存在或已删除')
            setDeleteTarget(null)
            break
          default:
            toast.error(e.message || '删除失败，请重试')
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
          <h1 className="text-xl font-semibold tracking-tight">课程模板</h1>
          <p className="text-sm text-muted-foreground">
            课程模板用于排课。发布后方可在「排课」中创建场次。
          </p>
        </div>
        <Hint content={canCreate ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={!canCreate}
            data-testid="course-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            新增课程
          </Button>
        </Hint>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="搜索课程名称"
          className="w-full sm:w-56"
          data-testid="course-search"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">状态</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as CourseStatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-32" data-testid="course-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="published">已发布</SelectItem>
              <SelectItem value="archived">已归档</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="rounded-lg border border-slate-200 bg-white"
        data-testid="courses-table"
      >
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无课程模板，点击右上角“新增课程”创建第一个课程
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>级别</TableHead>
                <TableHead>时长/容量</TableHead>
                <TableHead>可用门店</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((course) => (
                <TableRow
                  key={course.id}
                  data-testid="course-row"
                  data-title={course.title}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-primary hover:underline"
                    >
                      {course.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {course.categories.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        course.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          >
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat.color ?? '#cbd5e1' }}
                            />
                            {cat.name}
                          </span>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.level_label || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.duration_min} 分钟 · {course.default_capacity} 人
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.available_location_count} 家
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[course.status]}`}
                      data-testid="course-status-badge"
                    >
                      {STATUS_LABELS[course.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      {course.status !== 'published' ? (
                        <Hint
                          content={canEdit ? undefined : PERMISSION_DENIED_TOOLTIP}
                        >
                          <button
                            type="button"
                            className="text-green-700 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                            disabled={!canEdit || statusMutation.isPending}
                            onClick={() => changeStatus(course, 'published')}
                            data-testid={`course-publish-${course.id}`}
                          >
                            发布
                          </button>
                        </Hint>
                      ) : (
                        <Hint
                          content={canEdit ? undefined : PERMISSION_DENIED_TOOLTIP}
                        >
                          <button
                            type="button"
                            className="text-amber-700 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                            disabled={!canEdit || statusMutation.isPending}
                            onClick={() => changeStatus(course, 'archived')}
                            data-testid={`course-archive-${course.id}`}
                          >
                            归档
                          </button>
                        </Hint>
                      )}
                      <Link
                        href={`/courses/${course.id}`}
                        className="text-primary hover:underline"
                        data-testid={`course-detail-${course.id}`}
                      >
                        详情
                      </Link>
                      <Hint
                        content={canDelete ? undefined : PERMISSION_DENIED_TOOLTIP}
                      >
                        <button
                          type="button"
                          className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canDelete}
                          onClick={() => setDeleteTarget(course)}
                          data-testid={`course-delete-${course.id}`}
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
            共 {total} 个课程 · 第 {page} / {totalPages} 页
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

      <CourseFormDialog
        open={dialogOpen}
        initial={null}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除该课程模板？"
        description={
          deleteTarget ? (
            <span>
              将删除课程「
              <span className="font-medium">{deleteTarget.title}</span>
              」。若已有排课场次将无法删除。
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
