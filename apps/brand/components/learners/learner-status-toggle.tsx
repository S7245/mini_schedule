'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateLearnerStatus } from '@mini-schedule/api/learners'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type { Learner } from '@mini-schedule/types'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Hint } from '@/components/ui/hint'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

export interface LearnerStatusToggleProps {
  learner: Learner
}

export function LearnerStatusToggle({ learner }: LearnerStatusToggleProps) {
  const [confirming, setConfirming] = useState(false)
  const mutation = useUpdateLearnerStatus()
  const { has } = usePermissions()
  const canFreeze = has(PERMISSIONS.LEARNER_FREEZE)

  // 冻结/解冻只在 active↔frozen 之间。inactive（停用）学员不适用，隐藏入口，
  // 避免误把 inactive 翻成 frozen（后端只校验目标态，不挡源态）。
  if (learner.status === 'inactive') {
    return null
  }

  const isActive = learner.status !== 'frozen'
  const nextStatus = isActive ? 'frozen' : 'active'
  const actionLabel = isActive ? '冻结' : '解冻'

  async function applyChange() {
    try {
      await mutation.mutateAsync({ id: learner.id, status: nextStatus })
      toast.success(isActive ? '学员已冻结' : '学员已解冻')
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
      <Hint content={canFreeze ? undefined : PERMISSION_DENIED_TOOLTIP}>
        <button
          type="button"
          className={
            isActive
              ? 'text-amber-600 hover:underline text-sm disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline'
              : 'text-green-600 hover:underline text-sm disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline'
          }
          disabled={mutation.isPending || !canFreeze}
          onClick={() => setConfirming(true)}
          data-testid={`learner-status-toggle-${learner.id}`}
        >
          {actionLabel}
        </button>
      </Hint>

      <ConfirmDialog
        open={confirming}
        title={isActive ? '冻结该学员？' : '解冻该学员？'}
        description={
          isActive
            ? '冻结后，该学员将无法自助预约，但不会取消已有预约。'
            : '解冻后，该学员可恢复自助预约。'
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
