'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useCreateBrandLocation,
  useUpdateBrandLocation,
} from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { Location } from '@mini-schedule/types'
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
import { Textarea } from '@/components/ui/textarea'

const locationSchema = z.object({
  name: z.string().min(1, '请输入门店名称').max(100, '门店名称最多 100 个字符'),
  address: z.string().max(500, '地址最多 500 个字符').optional().or(z.literal('')),
  phone: z.string().max(20, '电话最多 20 个字符').optional().or(z.literal('')),
  remark: z.string().max(1000, '备注最多 1000 个字符').optional().or(z.literal('')),
})

type LocationForm = z.infer<typeof locationSchema>

export interface LocationFormDialogProps {
  open: boolean
  /** undefined = create mode, Location = edit mode */
  initial?: Location | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LocationFormDialog({
  open,
  initial,
  onOpenChange,
  onSuccess,
}: LocationFormDialogProps) {
  const createMutation = useCreateBrandLocation()
  const updateMutation = useUpdateBrandLocation()
  const [apiError, setApiError] = useState<string | null>(null)

  const isEdit = Boolean(initial)
  const pending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      remark: '',
    },
  })

  useEffect(() => {
    if (!open) return
    setApiError(null)
    reset({
      name: initial?.name ?? '',
      address: initial?.address ?? '',
      phone: initial?.phone ?? '',
      remark: initial?.remark ?? '',
    })
  }, [open, initial, reset])

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.LOCATION_NAME_DUPLICATED:
          return '该门店名称已存在'
        case ErrorCodes.QUOTA_EXCEEDED:
          return '门店数已达套餐上限，请联系平台升级套餐'
        case ErrorCodes.SUBSCRIPTION_RESTRICTED:
          return '订阅状态异常，暂无法新增 / 修改门店'
        case ErrorCodes.LOCATION_NOT_FOUND:
          return '门店不存在或已被删除'
        default:
          return err.message || '操作失败，请重试'
      }
    }
    return '操作失败，请重试'
  }

  const onSubmit = async (data: LocationForm) => {
    setApiError(null)
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          data: {
            name: data.name,
            address: data.address || undefined,
            phone: data.phone || undefined,
            remark: data.remark || undefined,
          },
        })
        toast.success('门店已更新')
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          address: data.address || undefined,
          phone: data.phone || undefined,
          remark: data.remark || undefined,
        })
        toast.success('门店已创建')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      const msg = mapApiError(err)
      if (
        err instanceof ApiErrorClass &&
        (err.code === ErrorCodes.QUOTA_EXCEEDED ||
          err.code === ErrorCodes.SUBSCRIPTION_RESTRICTED)
      ) {
        toast.error(msg)
        setApiError(msg)
        return
      }
      setApiError(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="location-form">
          <DialogHeader>
            <DialogTitle>{isEdit ? '编辑门店' : '新增门店'}</DialogTitle>
            <DialogDescription>
              {isEdit ? '修改门店信息' : '至少创建一个门店以完成开通'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">门店名称 *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">地址</Label>
              <Input id="address" {...register('address')} />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">联系电话</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea id="remark" rows={3} {...register('remark')} />
              {errors.remark && (
                <p className="text-sm text-destructive">{errors.remark.message}</p>
              )}
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
            <Button type="submit" disabled={pending}>
              {pending ? '保存中...' : isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
