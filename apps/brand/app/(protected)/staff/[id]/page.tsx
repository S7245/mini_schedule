'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useBrandStaff, useDeleteBrandStaff } from '@mini-schedule/api/staff'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { StaffBasicInfoCard } from '@/components/staff/staff-basic-info-card'
import { StaffRoleAssignmentEditor } from '@/components/staff/staff-role-assignment-editor'
import { StaffLocationAssignmentEditor } from '@/components/staff/staff-location-assignment-editor'
import { InstructorProfileSection } from '@/components/staff/instructor-profile-section'
import { StaffStatusToggle } from '@/components/staff/staff-status-toggle'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

export default function StaffDetailPage() {
  const params = useParams()
  const router = useRouter()
  const staffIdRaw = String(params.id ?? '')
  const staffId = Number(staffIdRaw)

  const idValid = Number.isFinite(staffId) && staffId > 0
  const staffQuery = useBrandStaff(idValid ? staffId : null)
  const deleteMutation = useDeleteBrandStaff()
  const [pendingDelete, setPendingDelete] = useState(false)
  const { has } = usePermissions()
  const canDelete = has(PERMISSIONS.STAFF_DELETE)

  if (!idValid) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">无效的员工 ID</p>
        <Link
          href="/staff"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          返回员工列表
        </Link>
      </div>
    )
  }

  if (staffQuery.isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">加载员工资料中...</div>
    )
  }

  if (staffQuery.isError || !staffQuery.data) {
    const err = staffQuery.error
    let msg = '加载员工失败'
    if (err instanceof ApiErrorClass) {
      if (err.code === ErrorCodes.STAFF_NOT_FOUND) msg = '员工不存在或已删除'
      else msg = err.message || msg
    }
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm text-destructive">{msg}</p>
        <Link
          href="/staff"
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          返回员工列表
        </Link>
      </div>
    )
  }

  const staff = staffQuery.data
  const ownerLocked = staff.is_owner

  async function confirmDelete() {
    try {
      await deleteMutation.mutateAsync(staffId)
      toast.success('员工已删除')
      setPendingDelete(false)
      router.push('/staff')
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === ErrorCodes.OWNER_PROTECTED) {
          toast.error('品牌负责人不可删除')
        } else {
          toast.error(err.message || '删除失败')
        }
      } else {
        toast.error('删除失败')
      }
      setPendingDelete(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/staff"
            className="mb-1 inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            返回员工列表
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            {staff.name}
            {staff.is_owner ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 align-middle">
                品牌负责人
              </span>
            ) : null}
          </h1>
          <p className="text-sm text-muted-foreground">手机号 {staff.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <StaffStatusToggle staff={staff} />
          <Button
            variant="destructive"
            size="sm"
            disabled={ownerLocked || !canDelete}
            title={
              ownerLocked
                ? '品牌负责人不可删除'
                : !canDelete
                  ? PERMISSION_DENIED_TOOLTIP
                  : undefined
            }
            onClick={() => setPendingDelete(true)}
            data-testid="staff-delete-button"
          >
            删除员工
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StaffBasicInfoCard staff={staff} />
        <InstructorProfileSection staff={staff} />
        <StaffRoleAssignmentEditor staff={staff} />
        <StaffLocationAssignmentEditor staff={staff} />
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title="删除该员工？"
        description={
          <span>
            将删除员工「<span className="font-medium">{staff.name}</span>
            」。删除后其角色与门店任职会同步移除，账号无法登录。
          </span>
        }
        confirmText="删除"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
