'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useCreateBrandCourse,
  useUpdateBrandCourse,
} from '@mini-schedule/api/courses'
import { useBrandCourseCategories } from '@mini-schedule/api/course-categories'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { CourseTemplate } from '@mini-schedule/types'
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

const courseSchema = z.object({
  title: z.string().min(2, '请输入课程名称（至少 2 个字符）').max(200, '课程名称过长'),
  description: z.string().max(2000, '简介过长').optional().or(z.literal('')),
  cover_url: z
    .string()
    .url('请输入有效的封面 URL')
    .optional()
    .or(z.literal('')),
  level_label: z.string().max(50, '级别标签过长').optional().or(z.literal('')),
  duration_min: z.coerce.number().int('时长必须为整数').min(1, '时长必须大于 0'),
  default_capacity: z.coerce.number().int('容量必须为整数').min(1, '容量必须大于 0'),
  show_in_mini_program: z.boolean(),
})

type CourseForm = z.infer<typeof courseSchema>

export interface CourseFormDialogProps {
  open: boolean
  /** undefined/null = create, CourseTemplate = edit */
  initial?: CourseTemplate | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CourseFormDialog({
  open,
  initial,
  onOpenChange,
  onSuccess,
}: CourseFormDialogProps) {
  const createMutation = useCreateBrandCourse()
  const updateMutation = useUpdateBrandCourse()
  const categoriesQuery = useBrandCourseCategories('active')
  const locationsQuery = useBrandLocations(1, 100, 'active')
  const [apiError, setApiError] = useState<string | null>(null)
  const [categoryIds, setCategoryIds] = useState<number[]>([])
  const [locationIds, setLocationIds] = useState<number[]>([])
  // create 模式只在打开时自动全选一次，之后尊重用户取消勾选（不再回填）。
  const didDefaultLocations = useRef(false)

  const isEdit = Boolean(initial)
  const pending = createMutation.isPending || updateMutation.isPending

  const categories = categoriesQuery.data?.items ?? []
  const locations = locationsQuery.data?.items ?? []

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      cover_url: '',
      level_label: '',
      duration_min: 60,
      default_capacity: 8,
      show_in_mini_program: true,
    },
  })

  const showInMini = watch('show_in_mini_program')

  useEffect(() => {
    if (!open) return
    setApiError(null)
    reset({
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      cover_url: initial?.cover_url ?? '',
      level_label: initial?.level_label ?? '',
      duration_min: initial?.duration_min ?? 60,
      default_capacity: initial?.default_capacity ?? 8,
      show_in_mini_program: initial?.show_in_mini_program ?? true,
    })
    setCategoryIds(initial?.category_ids ?? [])
    setLocationIds(initial?.available_location_ids ?? [])
    didDefaultLocations.current = isEdit // edit 模式不自动全选
  }, [open, initial, reset, isEdit])

  // create 模式：门店加载完成后，一次性默认全选；之后用户可自由取消勾选，不再回填。
  useEffect(() => {
    if (!open || didDefaultLocations.current) return
    if (locations.length > 0) {
      setLocationIds(locations.map((l) => l.id))
      didDefaultLocations.current = true
    }
  }, [open, locations])

  function toggle(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.CATEGORY_NOT_FOUND:
          return '所选分类不存在或已停用，请重新选择'
        case ErrorCodes.COURSE_NOT_FOUND:
          return '课程不存在或已被删除'
        default:
          return err.message || '操作失败，请重试'
      }
    }
    return '操作失败，请重试'
  }

  const onSubmit = async (data: CourseForm) => {
    setApiError(null)
    const payload = {
      title: data.title,
      description: data.description || null,
      cover_url: data.cover_url || null,
      level_label: data.level_label || null,
      duration_min: data.duration_min,
      default_capacity: data.default_capacity,
      category_ids: categoryIds,
      location_ids: locationIds,
      show_in_mini_program: data.show_in_mini_program,
    }
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: payload })
        toast.success('课程模板已更新')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('课程模板已创建')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setApiError(mapApiError(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="course-form">
          <DialogHeader>
            <DialogTitle>{isEdit ? '编辑课程模板' : '新增课程模板'}</DialogTitle>
            <DialogDescription>
              课程模板不绑定具体时间，排课时基于模板创建场次。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4 pr-1">
            <div className="space-y-2">
              <Label htmlFor="title">课程名称 *</Label>
              <Input id="title" {...register('title')} data-testid="course-field-title" />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">简介</Label>
              <Textarea
                id="description"
                rows={2}
                {...register('description')}
                data-testid="course-field-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level_label">级别（如 初级 / 进阶）</Label>
                <Input
                  id="level_label"
                  {...register('level_label')}
                  data-testid="course-field-level"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cover_url">封面 URL</Label>
                <Input
                  id="cover_url"
                  placeholder="https://..."
                  {...register('cover_url')}
                  data-testid="course-field-cover"
                />
                {errors.cover_url && (
                  <p className="text-sm text-destructive">
                    {errors.cover_url.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_min">默认时长（分钟）*</Label>
                <Input
                  id="duration_min"
                  type="number"
                  {...register('duration_min')}
                  data-testid="course-field-duration"
                />
                {errors.duration_min && (
                  <p className="text-sm text-destructive">
                    {errors.duration_min.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_capacity">默认容量 *</Label>
                <Input
                  id="default_capacity"
                  type="number"
                  {...register('default_capacity')}
                  data-testid="course-field-capacity"
                />
                {errors.default_capacity && (
                  <p className="text-sm text-destructive">
                    {errors.default_capacity.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>课程分类</Label>
              <div
                className="flex flex-wrap gap-2"
                data-testid="course-field-categories"
              >
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    暂无启用分类，可先到「课程分类」创建。
                  </p>
                ) : (
                  categories.map((cat) => {
                    const active = categoryIds.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryIds((s) => toggle(s, cat.id))}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        data-testid={`course-category-chip-${cat.id}`}
                        data-active={active}
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: cat.color ?? '#cbd5e1' }}
                        />
                        {cat.name}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>可用门店（排课时只能选已勾选门店）</Label>
              <div
                className="flex flex-col gap-2 rounded-md border border-slate-200 p-3"
                data-testid="course-field-locations"
              >
                {locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    暂无启用门店，请先到「门店管理」创建。
                  </p>
                ) : (
                  locations.map((loc) => (
                    <label
                      key={loc.id}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={locationIds.includes(loc.id)}
                        onChange={() => setLocationIds((s) => toggle(s, loc.id))}
                        data-testid={`course-location-${loc.id}`}
                      />
                      {loc.name}
                    </label>
                  ))
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showInMini}
                onChange={(e) =>
                  setValue('show_in_mini_program', e.target.checked, {
                    shouldDirty: true,
                  })
                }
                data-testid="course-field-show-mini"
              />
              在小程序中展示
            </label>

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
            <Button type="submit" disabled={pending} data-testid="course-submit">
              {pending ? '保存中...' : isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
