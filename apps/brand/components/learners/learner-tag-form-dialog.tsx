'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useCreateLearnerTag,
  useUpdateLearnerTag,
} from '@mini-schedule/api/learner-tags'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { LearnerTag } from '@mini-schedule/types'
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

const tagSchema = z.object({
  name: z.string().min(1, '请输入标签名').max(50, '标签名最多 50 个字符'),
  color: z.string().max(20, '颜色值过长').optional().or(z.literal('')),
})

type TagForm = z.infer<typeof tagSchema>

export interface LearnerTagFormDialogProps {
  open: boolean
  initial?: LearnerTag | null
  onOpenChange: (open: boolean) => void
}

export function LearnerTagFormDialog({
  open,
  initial,
  onOpenChange,
}: LearnerTagFormDialogProps) {
  const createMutation = useCreateLearnerTag()
  const updateMutation = useUpdateLearnerTag()
  const [apiError, setApiError] = useState<string | null>(null)

  const isEdit = Boolean(initial)
  const pending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TagForm>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: '', color: '' },
  })

  useEffect(() => {
    if (!open) return
    setApiError(null)
    reset({ name: initial?.name ?? '', color: initial?.color ?? '' })
  }, [open, initial, reset])

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      if (err.code === ErrorCodes.LEARNER_TAG_NAME_DUPLICATED) return '标签名已存在'
      if (err.code === ErrorCodes.LEARNER_TAG_NOT_FOUND) return '标签不存在或已被删除'
      return err.message || '操作失败，请重试'
    }
    return '操作失败，请重试'
  }

  const onSubmit = async (data: TagForm) => {
    setApiError(null)
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          data: { name: data.name, color: data.color || '' },
        })
        toast.success('标签已更新')
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          color: data.color || undefined,
        })
        toast.success('标签已创建')
      }
      onOpenChange(false)
    } catch (err) {
      setApiError(mapApiError(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="learner-tag-form">
          <DialogHeader>
            <DialogTitle>{isEdit ? '编辑标签' : '新增标签'}</DialogTitle>
            <DialogDescription>
              学员标签用于分组与筛选学员，可在学员资料中关联。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">标签名 *</Label>
              <Input
                id="tag-name"
                {...register('name')}
                data-testid="learner-tag-field-name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-color">颜色（可选，如 #f00）</Label>
              <Input
                id="tag-color"
                {...register('color')}
                placeholder="#3b82f6"
                data-testid="learner-tag-field-color"
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
            <Button type="submit" disabled={pending} data-testid="learner-tag-submit">
              {pending ? '保存中...' : isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
