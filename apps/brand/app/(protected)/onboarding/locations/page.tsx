'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Store, Plus } from 'lucide-react'
import {
  useBrandLocations,
  useDeleteBrandLocation,
} from '@mini-schedule/api/locations'
import { useBrandOnboardingStatus } from '@mini-schedule/api/onboarding'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type { Location } from '@mini-schedule/types'
import {
  ONBOARDING_STEP_ROUTES,
  WizardShell,
} from '@/components/onboarding/wizard-shell'
import { LocationFormDialog } from '@/components/locations/location-form-dialog'
import { LocationStatusToggle } from '@/components/locations/location-status-toggle'
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

export default function LocationsStepPage() {
  const router = useRouter()
  const statusQuery = useBrandOnboardingStatus()
  const listQuery = useBrandLocations(1, 50, 'all')
  const deleteMutation = useDeleteBrandLocation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Location | null>(null)

  const steps = statusQuery.data?.steps ?? []
  const locationStep = steps.find((s) => s.step_key === 'location')
  const hasActiveLocation = locationStep ? locationStep.status === 'completed' : false

  const items = listQuery.data?.items ?? []

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('门店已删除')
      setPendingDelete(null)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        toast.error(err.message || '删除失败')
      } else {
        toast.error('删除失败')
      }
      setPendingDelete(null)
    }
  }

  return (
    <WizardShell
      currentStepKey="location"
      steps={steps}
      title="创建第一个门店"
      description="至少创建并启用 1 个门店即可进入下一步。门店是排课和小程序展示的基础。"
      footer={
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push(ONBOARDING_STEP_ROUTES.brand_profile)}>
            上一步
          </Button>
          <Button
            disabled={!hasActiveLocation}
            onClick={() => router.push(ONBOARDING_STEP_ROUTES.staff)}
            data-testid="locations-next-button"
          >
            下一步
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            当前 {items.length} 个门店
            {locationStep?.target ? ` · 至少需要 ${locationStep.target} 个启用门店` : ''}
          </p>
          <Button onClick={openCreate} data-testid="locations-create-button">
            <Plus className="mr-1 h-4 w-4" />
            新增门店
          </Button>
        </div>

        {listQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">加载中...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无门店，请创建第一个
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>电话</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((loc) => (
                <TableRow key={loc.id} data-testid={`location-row-${loc.id}`}>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {loc.address || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {loc.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[loc.status] ?? ''
                      }`}
                    >
                      {STATUS_LABELS[loc.status] ?? loc.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        className="text-primary hover:underline text-sm"
                        onClick={() => openEdit(loc)}
                      >
                        编辑
                      </button>
                      <LocationStatusToggle location={loc} />
                      <button
                        type="button"
                        className="text-destructive hover:underline text-sm"
                        onClick={() => setPendingDelete(loc)}
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

      <LocationFormDialog
        open={dialogOpen}
        initial={editing}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="删除该门店？"
        description={
          pendingDelete ? (
            <span>
              将删除门店「<span className="font-medium">{pendingDelete.name}</span>
              」。删除后可在配额内重新创建同名门店。
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
