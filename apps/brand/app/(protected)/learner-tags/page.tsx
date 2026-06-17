'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Tag, Plus } from 'lucide-react'
import {
  useBrandLearnerTags,
  useUpdateLearnerTag,
} from '@mini-schedule/api/learner-tags'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type { LearnerTag } from '@mini-schedule/types'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LearnerTagFormDialog } from '@/components/learners/learner-tag-form-dialog'
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

export default function LearnerTagsPage() {
  const { has } = usePermissions()
  const canEdit = has(PERMISSIONS.LEARNER_EDIT)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LearnerTag | null>(null)

  const listQuery = useBrandLearnerTags('all')
  const tags = listQuery.data ?? []
  const updateMutation = useUpdateLearnerTag()

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(tag: LearnerTag) {
    setEditing(tag)
    setDialogOpen(true)
  }

  async function toggleStatus(tag: LearnerTag) {
    const next = tag.status === 'active' ? 'inactive' : 'active'
    try {
      await updateMutation.mutateAsync({ id: tag.id, data: { status: next } })
      toast.success(next === 'active' ? '标签已启用' : '标签已停用')
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        toast.error(err.message || '状态切换失败')
      } else {
        toast.error('状态切换失败')
      }
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">学员标签</h1>
          <p className="text-sm text-muted-foreground">
            管理学员分组标签。停用后不再可选，但已关联的学员不受影响。
          </p>
        </div>
        <Hint content={canEdit ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={openCreate}
            disabled={!canEdit}
            data-testid="learner-tag-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            新增标签
          </Button>
        </Hint>
      </div>

      <div
        className="rounded-lg border border-slate-200 bg-white"
        data-testid="learner-tags-table"
      >
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">加载中...</p>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无标签，点击右上角“新增标签”创建第一个标签
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标签名</TableHead>
                <TableHead>颜色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id} data-testid="learner-tag-row" data-name={tag.name}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {tag.color ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-slate-200"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.color}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[tag.status] ?? ''
                      }`}
                    >
                      {STATUS_LABELS[tag.status] ?? tag.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <Hint content={canEdit ? undefined : PERMISSION_DENIED_TOOLTIP}>
                        <button
                          type="button"
                          className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canEdit}
                          onClick={() => openEdit(tag)}
                          data-testid={`learner-tag-edit-${tag.id}`}
                        >
                          编辑
                        </button>
                      </Hint>
                      <Hint content={canEdit ? undefined : PERMISSION_DENIED_TOOLTIP}>
                        <button
                          type="button"
                          className="text-amber-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                          disabled={!canEdit || updateMutation.isPending}
                          onClick={() => toggleStatus(tag)}
                          data-testid={`learner-tag-toggle-${tag.id}`}
                        >
                          {tag.status === 'active' ? '停用' : '启用'}
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

      <LearnerTagFormDialog
        open={dialogOpen}
        initial={editing}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
