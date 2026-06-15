'use client'

import { useState } from 'react'
import { Plus, Tags } from 'lucide-react'
import { useBrandCourseCategories } from '@mini-schedule/api/course-categories'
import type {
  CourseCategory,
  CourseCategoryStatusFilter,
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
import { CategoryFormDialog } from '@/components/course-categories/category-form-dialog'
import { CategoryStatusToggle } from '@/components/course-categories/category-status-toggle'
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

export default function CourseCategoriesPage() {
  const { has } = usePermissions()
  const canCreate = has(PERMISSIONS.COURSE_CATEGORY_CREATE)
  const canEdit = has(PERMISSIONS.COURSE_CATEGORY_EDIT)

  const [statusFilter, setStatusFilter] =
    useState<CourseCategoryStatusFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CourseCategory | null>(null)

  const listQuery = useBrandCourseCategories(statusFilter)
  const items = listQuery.data?.items ?? []

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(cat: CourseCategory) {
    setEditing(cat)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">课程分类</h1>
          <p className="text-sm text-muted-foreground">
            分类用于组织课程模板。停用后不再可用于新建课程，已绑定课程不受影响。
          </p>
        </div>
        <Hint content={canCreate ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={openCreate}
            disabled={!canCreate}
            data-testid="category-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            新增分类
          </Button>
        </Hint>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">状态</span>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as CourseCategoryStatusFilter)
          }
        >
          <SelectTrigger className="w-32" data-testid="category-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className="rounded-lg border border-slate-200 bg-white"
        data-testid="categories-table"
      >
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Tags className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无课程分类，点击右上角“新增分类”添加第一个分类
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>小程序展示</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((cat) => (
                <TableRow
                  key={cat.id}
                  data-testid="category-row"
                  data-name={cat.name}
                >
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-slate-200"
                        style={{ backgroundColor: cat.color ?? '#cbd5e1' }}
                        data-testid="category-color-dot"
                      />
                      {cat.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.sort_order}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.show_in_mini_program ? '是' : '否'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[cat.status] ?? ''
                      }`}
                      data-testid="category-status-badge"
                    >
                      {STATUS_LABELS[cat.status] ?? cat.status}
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
                          onClick={() => openEdit(cat)}
                          data-testid={`category-edit-${cat.id}`}
                        >
                          编辑
                        </button>
                      </Hint>
                      <CategoryStatusToggle category={cat} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CategoryFormDialog
        open={dialogOpen}
        initial={editing}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
