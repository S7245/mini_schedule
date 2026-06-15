'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateCourseCategory } from '@mini-schedule/api/course-categories'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type { CourseCategory, CourseCategoryStatus } from '@mini-schedule/types'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Hint } from '@/components/ui/hint'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

export interface CategoryStatusToggleProps {
  category: CourseCategory
}

export function CategoryStatusToggle({ category }: CategoryStatusToggleProps) {
  const [confirming, setConfirming] = useState(false)
  const mutation = useUpdateCourseCategory()
  const { has } = usePermissions()
  const canEdit = has(PERMISSIONS.COURSE_CATEGORY_EDIT)

  const isActive = category.status === 'active'
  const nextStatus: CourseCategoryStatus = isActive ? 'inactive' : 'active'
  const actionLabel = isActive ? '停用' : '启用'

  async function applyChange() {
    try {
      await mutation.mutateAsync({
        id: category.id,
        data: { status: nextStatus },
      })
      toast.success(isActive ? '分类已停用' : '分类已启用')
      setConfirming(false)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        toast.error(err.message || '状态切换失败')
      } else {
        toast.error('状态切换失败')
      }
      setConfirming(false)
    }
  }

  return (
    <>
      <Hint content={canEdit ? undefined : PERMISSION_DENIED_TOOLTIP}>
        <button
          type="button"
          className={
            isActive
              ? 'text-amber-600 hover:underline text-sm disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline'
              : 'text-green-600 hover:underline text-sm disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline'
          }
          disabled={mutation.isPending || !canEdit}
          onClick={() => setConfirming(true)}
          data-testid={`category-status-toggle-${category.id}`}
        >
          {actionLabel}
        </button>
      </Hint>

      <ConfirmDialog
        open={confirming}
        title={isActive ? '停用该分类？' : '启用该分类？'}
        description={
          isActive
            ? '停用后，该分类将不再可用于新建课程，但已绑定的课程不受影响。'
            : '启用后，该分类可再次用于课程绑定。'
        }
        confirmText={actionLabel}
        destructive={isActive}
        loading={mutation.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={applyChange}
      />
    </>
  )
}
