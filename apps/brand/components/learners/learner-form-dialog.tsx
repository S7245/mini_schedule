'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateLearner, useUpdateLearner } from '@mini-schedule/api/learners'
import { useBrandLearnerTags } from '@mini-schedule/api/learner-tags'
import { ApiErrorClass, ErrorCodes, getQuotaDetails } from '@mini-schedule/api/errors'
import type { Learner, Location } from '@mini-schedule/types'
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

const learnerSchema = z.object({
  phone: z
    .string()
    .min(5, '请输入合法手机号')
    .max(20, '手机号过长')
    .regex(/^[0-9+\- ]+$/, '请输入合法手机号'),
  nickname: z.string().max(100, '昵称最多 100 个字符').optional().or(z.literal('')),
  primary_location_id: z.coerce.number().int().nonnegative().optional(),
  learner_no: z.string().max(50, '学号最多 50 个字符').optional().or(z.literal('')),
  remark: z.string().max(1000, '备注最多 1000 个字符').optional().or(z.literal('')),
})

type LearnerForm = z.infer<typeof learnerSchema>

export interface LearnerFormDialogProps {
  open: boolean
  /** undefined/null = create mode, Learner = edit mode */
  initial?: Learner | null
  locations: Location[]
  defaultLocationId?: number
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LearnerFormDialog({
  open,
  initial,
  locations,
  defaultLocationId,
  onOpenChange,
  onSuccess,
}: LearnerFormDialogProps) {
  const createMutation = useCreateLearner()
  const updateMutation = useUpdateLearner()
  const [apiError, setApiError] = useState<string | null>(null)
  const [quota, setQuota] = useState<{ current: number; max: number } | null>(null)
  const [selectedTags, setSelectedTags] = useState<number[]>([])

  const tagsQuery = useBrandLearnerTags('active', open)
  const tags = tagsQuery.data ?? []

  const isEdit = Boolean(initial)
  const pending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LearnerForm>({
    resolver: zodResolver(learnerSchema),
    defaultValues: {
      phone: '',
      nickname: '',
      primary_location_id: defaultLocationId ?? 0,
      learner_no: '',
      remark: '',
    },
  })

  useEffect(() => {
    if (!open) return
    setApiError(null)
    setQuota(null)
    setSelectedTags(initial?.tags?.map((t) => t.id) ?? [])
    reset({
      phone: initial?.phone ?? '',
      nickname: initial?.nickname ?? '',
      primary_location_id: initial?.primary_location_id ?? defaultLocationId ?? 0,
      learner_no: initial?.learner_no ?? '',
      remark: initial?.remark ?? '',
    })
  }, [open, initial, defaultLocationId, reset])

  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.LEARNER_ALREADY_EXISTS:
          return '该手机号在本品牌已有学员档案'
        case ErrorCodes.LEARNER_NO_DUPLICATED:
          return '该学号已被占用'
        case ErrorCodes.LEARNER_TAG_NOT_FOUND:
          return '所选标签不存在或已停用，请刷新后重试'
        case ErrorCodes.QUOTA_EXCEEDED:
          return '学员数量已达套餐上限，请升级套餐或联系平台'
        case ErrorCodes.LOCATION_NOT_FOUND:
          return '门店不存在或已停用'
        default:
          return err.message || '操作失败，请重试'
      }
    }
    return '操作失败，请重试'
  }

  const onSubmit = async (data: LearnerForm) => {
    setApiError(null)
    setQuota(null)
    const pid = data.primary_location_id ?? 0
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          data: {
            nickname: data.nickname || '',
            primary_location_id: pid > 0 ? pid : 0, // 0 = 清空主门店
            learner_no: data.learner_no || '',
            remark: data.remark || '',
            tag_ids: selectedTags,
          },
        })
        toast.success('学员已更新')
      } else {
        await createMutation.mutateAsync({
          phone: data.phone,
          nickname: data.nickname || undefined,
          primary_location_id: pid > 0 ? pid : undefined,
          learner_no: data.learner_no || undefined,
          remark: data.remark || undefined,
          tag_ids: selectedTags,
        })
        toast.success('学员已创建')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      const msg = mapApiError(err)
      if (err instanceof ApiErrorClass && err.code === ErrorCodes.QUOTA_EXCEEDED) {
        const q = getQuotaDetails(err)
        if (q) setQuota(q)
        toast.error(msg)
      }
      setApiError(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="learner-form">
          <DialogHeader>
            <DialogTitle>{isEdit ? '编辑学员' : '新增学员'}</DialogTitle>
            <DialogDescription>
              学员档案是预约的前置主数据。手机号用于身份识别，同一手机号在多个品牌可复用同一身份。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="learner-phone">手机号 *</Label>
              {isEdit ? (
                <Input
                  id="learner-phone"
                  value={initial?.phone ?? ''}
                  disabled
                  data-testid="learner-field-phone-locked"
                />
              ) : (
                <Input
                  id="learner-phone"
                  {...register('phone')}
                  data-testid="learner-field-phone"
                />
              )}
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="learner-nickname">昵称</Label>
              <Input
                id="learner-nickname"
                {...register('nickname')}
                data-testid="learner-field-nickname"
              />
              {errors.nickname && (
                <p className="text-sm text-destructive">{errors.nickname.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="learner-location">主门店</Label>
                <select
                  id="learner-location"
                  {...register('primary_location_id')}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  data-testid="learner-field-location"
                >
                  <option value={0}>未分配</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="learner-no">学号（可选）</Label>
                <Input
                  id="learner-no"
                  {...register('learner_no')}
                  data-testid="learner-field-learner-no"
                />
                {errors.learner_no && (
                  <p className="text-sm text-destructive">
                    {errors.learner_no.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>标签</Label>
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  暂无可用标签，可到「学员标签」创建。
                </p>
              ) : (
                <div className="flex flex-wrap gap-2" data-testid="learner-field-tags">
                  {tags.map((tag) => {
                    const selected = selectedTags.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-slate-200 text-muted-foreground hover:border-slate-300'
                        }`}
                        data-testid={`learner-tag-option-${tag.id}`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="learner-remark">备注（可选）</Label>
              <Input
                id="learner-remark"
                {...register('remark')}
                data-testid="learner-field-remark"
              />
            </div>

            {apiError ? (
              <p
                data-testid="api-error"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {apiError}
                {quota ? `（当前 ${quota.current} / 上限 ${quota.max}）` : ''}
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
            <Button type="submit" disabled={pending} data-testid="learner-submit">
              {pending ? '保存中...' : isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
