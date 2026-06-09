'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, UsersRound } from 'lucide-react'
import { useBrandStaffList, useDeleteBrandStaff } from '@mini-schedule/api/staff'
import { useBrandOnboardingStatus } from '@mini-schedule/api/onboarding'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { StaffListItem } from '@mini-schedule/types'
import {
  ONBOARDING_STEP_ROUTES,
  WizardShell,
} from '@/components/onboarding/wizard-shell'
import { StaffCreateDialog } from '@/components/staff/staff-create-dialog'
import { StaffStatusToggle } from '@/components/staff/staff-status-toggle'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATUS_LABELS: Record<string, string> = {
  active: '启用',
  inactive: '停用',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-700',
}

export default function StaffStepPage() {
  const router = useRouter()
  const statusQuery = useBrandOnboardingStatus()
  const listQuery = useBrandStaffList({ page: 1, page_size: 50, status: 'all' })
  const deleteMutation = useDeleteBrandStaff()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<StaffListItem | null>(null)

  const steps = statusQuery.data?.steps ?? []
  const staffStep = steps.find((s) => s.step_key === 'staff')
  const stepDone = staffStep
    ? staffStep.status === 'completed' || staffStep.status === 'skipped'
    : false

  const items = listQuery.data?.items ?? []
  const activeStaffCount = items.filter((s) => s.status === 'active').length
  const instructorCount = items.filter((s) => s.has_instructor).length

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('员工已删除')
      setPendingDelete(null)
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
      setPendingDelete(null)
    }
  }

  return (
    <WizardShell
      currentStepKey="staff"
      steps={steps}
      title="添加员工与教练"
      description="至少新增 1 名活跃员工并配置 1 名教练后可继续；可在工作台「员工管理」中长期维护。"
      footer={
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() =>
              router.push(ONBOARDING_STEP_ROUTES.location)
            }
          >
            上一步
          </Button>
          <Button
            disabled={!stepDone}
            onClick={() =>
              router.push(ONBOARDING_STEP_ROUTES.course_category)
            }
            data-testid="staff-next-button"
          >
            下一步
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            当前 {activeStaffCount} 名活跃员工 · {instructorCount} 名教练
            {staffStep && staffStep.target > 0
              ? ` · 至少需要 ${staffStep.target} 名`
              : ''}
            {stepDone ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                已完成
              </span>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/staff"
              className="text-sm text-primary hover:underline"
            >
              前往员工管理 →
            </Link>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              data-testid="staff-onboarding-create-button"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              新增员工
            </Button>
          </div>
        </div>

        {listQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UsersRound className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无员工，请创建第一名员工
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>教练</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((staff) => (
                <TableRow
                  key={staff.id}
                  data-testid={`staff-onboarding-row-${staff.id}`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/staff/${staff.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {staff.name}
                      </Link>
                      {staff.is_owner ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                          负责人
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {staff.phone}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[staff.status] ?? ''
                      }`}
                    >
                      {STATUS_LABELS[staff.status] ?? staff.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {staff.has_instructor ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        教练
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/staff/${staff.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        详情
                      </Link>
                      <StaffStatusToggle staff={staff} />
                      <button
                        type="button"
                        className="text-destructive hover:underline text-sm disabled:opacity-50 disabled:no-underline"
                        disabled={staff.is_owner}
                        title={staff.is_owner ? '品牌负责人不可删除' : undefined}
                        onClick={() => setPendingDelete(staff)}
                      >
                        删除
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <StaffCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="删除该员工？"
        description={
          pendingDelete ? (
            <span>
              将删除员工「
              <span className="font-medium">{pendingDelete.name}</span>
              」。删除后其角色与门店任职会同步移除。
            </span>
          ) : null
        }
        confirmText="删除"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </WizardShell>
  )
}
