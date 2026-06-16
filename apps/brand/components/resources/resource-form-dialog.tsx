'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useCreateLocationResource,
  useUpdateLocationResource,
} from '@mini-schedule/api/location-resources'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { Location, LocationResource } from '@mini-schedule/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  classroom: '教室',
  venue: '场地',
  online: '线上',
  equipment: '设备',
  other: '其他',
}

const resourceSchema = z.object({
  location_id: z.coerce.number().int().positive('请选择门店'),
  name: z.string().min(1, '请输入资源名称').max(100, '资源名称最多 100 个字符'),
  type: z.enum(['classroom', 'venue', 'online', 'equipment', 'other']),
  capacity: z.coerce
    .number()
    .int('容量必须为整数')
    .min(1, '容量至少为 1')
    .max(100000, '容量过大'),
  remark: z.string().max(1000, '备注最多 1000 个字符').optional().or(z.literal('')),
})

type ResourceForm = z.infer<typeof resourceSchema>

export interface ResourceFormDialogProps {
  open: boolean
  /** undefined/null = create mode, LocationResource = edit mode */
  initial?: LocationResource | null
  /** active locations for the create-mode门店 selector */
  locations: Location[]
  /** preselected location in create mode (current page filter) */
  defaultLocationId?: number
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ResourceFormDialog({
  open,
  initial,
  locations,
  defaultLocationId,
  onOpenChange,
  onSuccess,
}: ResourceFormDialogProps) {
  const createMutation = useCreateLocationResource()
  const updateMutation = useUpdateLocationResource()
  const [apiError, setApiError] = useState<string | null>(null)

  const isEdit = Boolean(initial)
  const pending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      location_id: defaultLocationId ?? 0,
      name: '',
      type: 'classroom',
      capacity: 1,
      remark: '',
    },
  })

  useEffect(() => {
    if (!open) return
    setApiError(null)
    reset({
      location_id: initial?.location_id ?? defaultLocationId ?? 0,
      name: initial?.name ?? '',
      type: initial?.type ?? 'classroom',
      capacity: initial?.capacity ?? 1,
      remark: initial?.remark ?? '',
    })
  }, [open, initial, defaultLocationId, reset])

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.RESOURCE_NAME_DUPLICATED:
          return '该门店已有同名资源'
        case ErrorCodes.RESOURCE_NOT_FOUND:
          return '资源不存在或已被删除'
        case ErrorCodes.LOCATION_NOT_FOUND:
          return '门店不存在或已停用'
        default:
          return err.message || '操作失败，请重试'
      }
    }
    return '操作失败，请重试'
  }

  const onSubmit = async (data: ResourceForm) => {
    setApiError(null)
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          data: {
            name: data.name,
            type: data.type,
            capacity: data.capacity,
            remark: data.remark || '',
          },
        })
        toast.success('资源已更新')
      } else {
        await createMutation.mutateAsync({
          location_id: data.location_id,
          name: data.name,
          type: data.type,
          capacity: data.capacity,
          remark: data.remark || undefined,
        })
        toast.success('资源已创建')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      const msg = mapApiError(err)
      if (
        err instanceof ApiErrorClass &&
        err.code === ErrorCodes.RESOURCE_NAME_DUPLICATED
      ) {
        toast.error(msg)
      }
      setApiError(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="resource-form">
          <DialogHeader>
            <DialogTitle>{isEdit ? '编辑资源' : '新增资源'}</DialogTitle>
            <DialogDescription>
              资源是门店下可被排课占用的对象（教室/场地/线上/设备）。同一资源同一时段只能被一节有效场次占用。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resource-location">门店 *</Label>
              {isEdit ? (
                <Input
                  id="resource-location"
                  value={initial?.location_name ?? ''}
                  disabled
                  data-testid="resource-field-location-locked"
                />
              ) : (
                <select
                  id="resource-location"
                  {...register('location_id')}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  data-testid="resource-field-location"
                >
                  <option value={0}>请选择门店</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.location_id && (
                <p className="text-sm text-destructive">
                  {errors.location_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-name">资源名称 *</Label>
              <Input
                id="resource-name"
                {...register('name')}
                data-testid="resource-field-name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resource-type">类型 *</Label>
                <select
                  id="resource-type"
                  {...register('type')}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  data-testid="resource-field-type"
                >
                  {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-capacity">容量 *</Label>
                <Input
                  id="resource-capacity"
                  type="number"
                  min={1}
                  {...register('capacity')}
                  data-testid="resource-field-capacity"
                />
                {errors.capacity && (
                  <p className="text-sm text-destructive">
                    {errors.capacity.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-remark">备注（可选）</Label>
              <Input
                id="resource-remark"
                {...register('remark')}
                data-testid="resource-field-remark"
              />
            </div>

            {apiError ? (
              <p
                data-testid="api-error"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {apiError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              取消
            </Button>
            <Button type="submit" disabled={pending} data-testid="resource-submit">
              {pending ? '保存中...' : isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
