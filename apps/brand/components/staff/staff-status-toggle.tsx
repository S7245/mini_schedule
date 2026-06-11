'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateBrandStaffStatus } from '@mini-schedule/api/staff'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { StaffListItem, StaffStatus } from '@mini-schedule/types'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Hint } from '@/components/ui/hint'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

export interface StaffStatusToggleProps {
  /**
   * Minimal staff projection — list + detail page both call into the same
   * mutation, so we only need id / status / is_owner here.
   */
  staff: Pick<StaffListItem, 'id' | 'status' | 'is_owner' | 'name'>
  /**
   * Optional render override — when omitted defaults to "停用 / 启用" link button.
   */
  className?: string
}

/**
 * Status toggle for a single Staff row. Mirrors LocationStatusToggle:
 *  - link-button + ConfirmDialog (no shadcn switch)
 *  - destructive coloring when current=active (deactivate is the dangerous op)
 *  - blocks the action entirely when staff.is_owner — owner cannot go inactive
 *    per backend OWNER_PROTECTED (we surface a tooltip via title attr).
 */
export function StaffStatusToggle({ staff, className }: StaffStatusToggleProps) {
  const [confirming, setConfirming] = useState(false)
  const mutation = useUpdateBrandStaffStatus()
  const { has } = usePermissions()
  const canEdit = has(PERMISSIONS.STAFF_EDIT)

  const isActive = staff.status === 'active'
  const nextStatus: StaffStatus = isActive ? 'inactive' : 'active'
  const actionLabel = isActive ? '停用' : '启用'
  const ownerLocked = staff.is_owner && isActive

  async function applyChange() {
    try {
      await mutation.mutateAsync({ id: staff.id, status: nextStatus })
      toast.success(isActive ? '员工已停用' : '员工已启用')
      setConfirming(false)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === ErrorCodes.OWNER_PROTECTED) {
          toast.error('品牌负责人不可停用，请先转移负责人身份')
        } else if (err.code === ErrorCodes.SUBSCRIPTION_RESTRICTED) {
          toast.error('订阅状态异常，无法切换员工状态')
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
      <Hint
        content={
          ownerLocked
            ? '品牌负责人不可停用'
            : !canEdit
              ? PERMISSION_DENIED_TOOLTIP
              : undefined
        }
      >
        <button
          type="button"
          className={
            className ??
            (isActive
              ? 'text-amber-600 hover:underline text-sm disabled:opacity-50 disabled:no-underline'
              : 'text-green-600 hover:underline text-sm disabled:opacity-50 disabled:no-underline')
          }
          disabled={mutation.isPending || ownerLocked || !canEdit}
          onClick={() => setConfirming(true)}
          data-testid={`staff-status-toggle-${staff.id}`}
        >
          {actionLabel}
        </button>
      </Hint>

      <ConfirmDialog
        open={confirming}
        title={isActive ? '停用该员工？' : '启用该员工？'}
        description={
          isActive ? (
            <span>
              将停用员工「
              <span className="font-medium">{staff.name}</span>
              」。停用后该账号将无法登录品牌后台，已配置的角色和门店任职会保留。
            </span>
          ) : (
            <span>
              将启用员工「<span className="font-medium">{staff.name}</span>」。
              该账号将恢复登录权限。
            </span>
          )
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
