'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateBrandLocationStatus } from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { Location, LocationStatus } from '@mini-schedule/types'
import { ConfirmDialog } from '@/components/common/confirm-dialog'

export interface LocationStatusToggleProps {
  location: Location
}

/**
 * Status toggle using the same link-button + ConfirmDialog convention
 * already used on the brand course management page (publish / archive),
 * keeping the look consistent with the rest of the admin pages.
 *
 * Intentionally NOT using shadcn `switch` per Batch 4 decision (Q3).
 */
export function LocationStatusToggle({ location }: LocationStatusToggleProps) {
  const [confirming, setConfirming] = useState(false)
  const mutation = useUpdateBrandLocationStatus()

  const isActive = location.status === 'active'
  const nextStatus: LocationStatus = isActive ? 'inactive' : 'active'
  const actionLabel = isActive ? '停用' : '启用'

  async function applyChange() {
    try {
      await mutation.mutateAsync({ id: location.id, status: nextStatus })
      toast.success(isActive ? '门店已停用' : '门店已启用')
      setConfirming(false)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === ErrorCodes.SUBSCRIPTION_RESTRICTED) {
          toast.error('订阅状态异常，无法切换门店状态')
        } else {
          toast.error(err.message || '状态切换失败')
        }
      } else {
        toast.error('状态切换失败')
      }
      setConfirming(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={
          isActive
            ? 'text-amber-600 hover:underline text-sm'
            : 'text-green-600 hover:underline text-sm'
        }
        disabled={mutation.isPending}
        onClick={() => setConfirming(true)}
        data-testid={`location-status-toggle-${location.id}`}
      >
        {actionLabel}
      </button>

      <ConfirmDialog
        open={confirming}
        title={isActive ? '停用该门店？' : '启用该门店？'}
        description={
          isActive
            ? '停用后，该门店将不再出现在小程序与排课入口，但仍占用门店配额。'
            : '启用后，该门店将再次对外可见。'
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
