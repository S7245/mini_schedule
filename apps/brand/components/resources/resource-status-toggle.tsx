'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateLocationResource } from '@mini-schedule/api/location-resources'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type {
  LocationResource,
  LocationResourceStatus,
} from '@mini-schedule/types'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Hint } from '@/components/ui/hint'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

export interface ResourceStatusToggleProps {
  resource: LocationResource
}

export function ResourceStatusToggle({ resource }: ResourceStatusToggleProps) {
  const [confirming, setConfirming] = useState(false)
  const mutation = useUpdateLocationResource()
  const { has } = usePermissions()
  const canEdit = has(PERMISSIONS.LOCATION_RESOURCE_EDIT)

  const isActive = resource.status === 'active'
  const nextStatus: LocationResourceStatus = isActive ? 'inactive' : 'active'
  const actionLabel = isActive ? '停用' : '启用'

  async function applyChange() {
    try {
      await mutation.mutateAsync({
        id: resource.id,
        data: { status: nextStatus },
      })
      toast.success(isActive ? '资源已停用' : '资源已启用')
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
          data-testid={`resource-status-toggle-${resource.id}`}
        >
          {actionLabel}
        </button>
      </Hint>

      <ConfirmDialog
        open={confirming}
        title={isActive ? '停用该资源？' : '启用该资源？'}
        description={
          isActive
            ? '停用后，该资源将不再可用于新排课，但已排定的场次不受影响。'
            : '启用后，该资源可再次用于排课。'
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
