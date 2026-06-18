'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useCreateEntitlementProduct,
  useUpdateEntitlementProduct,
} from '@mini-schedule/api/entitlement-products'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { useBrandCourses } from '@mini-schedule/api/courses'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  EntitlementProduct,
  EntitlementProductType,
  EntitlementScope,
} from '@mini-schedule/types'
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

export const PRODUCT_TYPE_LABELS: Record<EntitlementProductType, string> = {
  class_pack: '次数/课时包',
  trial_pack: '单次体验包',
  membership_card: '会员卡',
}

const isCountBased = (t: EntitlementProductType) =>
  t === 'class_pack' || t === 'trial_pack'

const formSchema = z.object({
  name: z.string().min(1, '请输入产品名称').max(100, '名称最多 100 字'),
  description: z.string().max(1000).optional().or(z.literal('')),
  total_credits: z.coerce.number().int().min(0, '次数不能为负'),
  validity_days: z.coerce.number().int().min(1, '有效期至少 1 天').max(36500),
  daily_booking_limit: z.coerce.number().int().min(0),
  weekly_booking_limit: z.coerce.number().int().min(0),
  monthly_booking_limit: z.coerce.number().int().min(0),
  concurrent_booking_limit: z.coerce.number().int().min(0),
})

type FormValues = z.infer<typeof formSchema>

export interface EntitlementProductFormDialogProps {
  open: boolean
  initial?: EntitlementProduct | null
  onOpenChange: (open: boolean) => void
}

export function EntitlementProductFormDialog({
  open,
  initial,
  onOpenChange,
}: EntitlementProductFormDialogProps) {
  const createMutation = useCreateEntitlementProduct()
  const updateMutation = useUpdateEntitlementProduct()
  const [apiError, setApiError] = useState<string | null>(null)

  const [productType, setProductType] = useState<EntitlementProductType>('class_pack')
  const [locationScope, setLocationScope] = useState<EntitlementScope>('all')
  const [courseScope, setCourseScope] = useState<EntitlementScope>('all')
  const [locationIds, setLocationIds] = useState<number[]>([])
  const [courseIds, setCourseIds] = useState<number[]>([])

  const locationsQuery = useBrandLocations(1, 100, 'active')
  const locations = useMemo(() => locationsQuery.data?.items ?? [], [locationsQuery.data])
  const coursesQuery = useBrandCourses({ status: 'published', page: 1, page_size: 100 })
  const courses = useMemo(() => coursesQuery.data?.items ?? [], [coursesQuery.data])

  const isEdit = Boolean(initial)
  const pending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      total_credits: 10,
      validity_days: 90,
      daily_booking_limit: 0,
      weekly_booking_limit: 0,
      monthly_booking_limit: 0,
      concurrent_booking_limit: 0,
    },
  })

  useEffect(() => {
    if (!open) return
    setApiError(null)
    setProductType(initial?.product_type ?? 'class_pack')
    setLocationScope(initial?.location_scope ?? 'all')
    setCourseScope(initial?.course_scope ?? 'all')
    setLocationIds(initial?.location_ids ?? [])
    setCourseIds(initial?.course_ids ?? [])
    reset({
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      total_credits: initial?.total_credits ?? 10,
      validity_days: initial?.validity_days ?? 90,
      daily_booking_limit: initial?.daily_booking_limit ?? 0,
      weekly_booking_limit: initial?.weekly_booking_limit ?? 0,
      monthly_booking_limit: initial?.monthly_booking_limit ?? 0,
      concurrent_booking_limit: initial?.concurrent_booking_limit ?? 0,
    })
  }, [open, initial, reset])

  function toggleId(setter: typeof setLocationIds, id: number) {
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.ENTITLEMENT_PRODUCT_NAME_DUPLICATED:
          return '已存在同名启用产品'
        case ErrorCodes.ENTITLEMENT_SCOPE_INVALID:
          return '适用范围包含无效或未启用的门店/课程'
        default:
          return err.message || '操作失败，请重试'
      }
    }
    return '操作失败，请重试'
  }

  const onSubmit = async (data: FormValues) => {
    setApiError(null)
    if (isCountBased(productType) && data.total_credits <= 0) {
      setApiError('次数/课时包必须设置大于 0 的次数')
      return
    }
    if (locationScope === 'specific' && locationIds.length === 0) {
      setApiError('指定门店范围时至少选 1 个门店')
      return
    }
    if (courseScope === 'specific' && courseIds.length === 0) {
      setApiError('指定课程范围时至少选 1 个课程')
      return
    }
    const common = {
      name: data.name,
      description: data.description || '',
      total_credits: isCountBased(productType) ? data.total_credits : 0,
      validity_days: data.validity_days,
      daily_booking_limit: data.daily_booking_limit,
      weekly_booking_limit: data.weekly_booking_limit,
      monthly_booking_limit: data.monthly_booking_limit,
      concurrent_booking_limit: data.concurrent_booking_limit,
      location_scope: locationScope,
      course_scope: courseScope,
      location_ids: locationScope === 'specific' ? locationIds : [],
      course_ids: courseScope === 'specific' ? courseIds : [],
    }
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: common })
        toast.success('产品已更新')
      } else {
        await createMutation.mutateAsync({ ...common, product_type: productType })
        toast.success('产品已创建')
      }
      onOpenChange(false)
    } catch (err) {
      setApiError(mapApiError(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="entitlement-product-form">
          <DialogHeader>
            <DialogTitle>{isEdit ? '编辑权益产品' : '新增权益产品'}</DialogTitle>
            <DialogDescription>
              定义可发放给学员的权益模板。次数/课时包按次计，会员卡按有效期不限次。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>类型 *</Label>
              {isEdit ? (
                <Input value={PRODUCT_TYPE_LABELS[productType]} disabled data-testid="product-field-type-locked" />
              ) : (
                <div className="flex gap-2" data-testid="product-field-type">
                  {(Object.keys(PRODUCT_TYPE_LABELS) as EntitlementProductType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setProductType(t)}
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        productType === t
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 text-muted-foreground'
                      }`}
                    >
                      {PRODUCT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name">名称 *</Label>
              <Input id="product-name" {...register('name')} data-testid="product-field-name" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isCountBased(productType) ? (
                <div className="space-y-2">
                  <Label htmlFor="product-credits">次数 *</Label>
                  <Input id="product-credits" type="number" min={1} {...register('total_credits')} data-testid="product-field-credits" />
                  {errors.total_credits && (
                    <p className="text-sm text-destructive">{errors.total_credits.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>次数</Label>
                  <Input value="不限次" disabled />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="product-validity">有效期（天）*</Label>
                <Input id="product-validity" type="number" min={1} {...register('validity_days')} data-testid="product-field-validity" />
                {errors.validity_days && (
                  <p className="text-sm text-destructive">{errors.validity_days.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>频次上限（0 = 不限）</Label>
              <div className="grid grid-cols-4 gap-2">
                <LimitField label="每日" reg={register('daily_booking_limit')} />
                <LimitField label="每周" reg={register('weekly_booking_limit')} />
                <LimitField label="每月" reg={register('monthly_booking_limit')} />
                <LimitField label="同时" reg={register('concurrent_booking_limit')} />
              </div>
            </div>

            <ScopePicker
              label="适用门店"
              scope={locationScope}
              onScope={setLocationScope}
              options={locations.map((l) => ({ id: l.id, name: l.name }))}
              selected={locationIds}
              onToggle={(id) => toggleId(setLocationIds, id)}
              testid="location"
            />
            <ScopePicker
              label="适用课程"
              scope={courseScope}
              onScope={setCourseScope}
              options={courses.map((c) => ({ id: c.id, name: c.title }))}
              selected={courseIds}
              onToggle={(id) => toggleId(setCourseIds, id)}
              testid="course"
            />

            <div className="space-y-2">
              <Label htmlFor="product-desc">描述（可选）</Label>
              <Input id="product-desc" {...register('description')} data-testid="product-field-desc" />
            </div>

            {apiError ? (
              <p data-testid="api-error" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {apiError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              取消
            </Button>
            <Button type="submit" disabled={pending} data-testid="product-submit">
              {pending ? '保存中...' : isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LimitField({
  label,
  reg,
}: {
  label: string
  reg: ReturnType<ReturnType<typeof useForm<FormValues>>['register']>
}) {
  return (
    <div>
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <Input type="number" min={0} {...reg} />
    </div>
  )
}

function ScopePicker({
  label,
  scope,
  onScope,
  options,
  selected,
  onToggle,
  testid,
}: {
  label: string
  scope: EntitlementScope
  onScope: (s: EntitlementScope) => void
  options: { id: number; name: string }[]
  selected: number[]
  onToggle: (id: number) => void
  testid: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {(['all', 'specific'] as EntitlementScope[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onScope(s)}
            className={`rounded-md border px-3 py-1 text-sm ${
              scope === s ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-muted-foreground'
            }`}
            data-testid={`product-${testid}-scope-${s}`}
          >
            {s === 'all' ? '全部' : '指定'}
          </button>
        ))}
      </div>
      {scope === 'specific' ? (
        <div className="flex flex-wrap gap-2" data-testid={`product-${testid}-options`}>
          {options.length === 0 ? (
            <span className="text-sm text-muted-foreground">暂无可选项</span>
          ) : (
            options.map((o) => {
              const on = selected.includes(o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onToggle(o.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    on ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-muted-foreground'
                  }`}
                >
                  {o.name}
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
