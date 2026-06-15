'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useCreateCourseCategory,
  useUpdateCourseCategory,
} from '@mini-schedule/api/course-categories'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { CourseCategory } from '@mini-schedule/types'
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

const PRESET_COLORS = [
  '#2563eb',
  '#16a34a',
  '#db2777',
  '#ea580c',
  '#7c3aed',
  '#0891b2',
  '#ca8a04',
  '#dc2626',
]

const categorySchema = z.object({
  name: z.string().min(1, '请输入分类名称').max(50, '分类名称最多 50 个字符'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, '请选择或输入合法的 16 进制颜色')
    .optional()
    .or(z.literal('')),
  icon: z.string().max(50, '图标标识最多 50 个字符').optional().or(z.literal('')),
  sort_order: z.coerce
    .number()
    .int('排序值必须为整数')
    .min(0, '排序值不能为负')
    .max(9999, '排序值过大'),
  show_in_mini_program: z.boolean(),
})

type CategoryForm = z.infer<typeof categorySchema>

export interface CategoryFormDialogProps {
  open: boolean
  /** undefined/null = create mode, CourseCategory = edit mode */
  initial?: CourseCategory | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CategoryFormDialog({
  open,
  initial,
  onOpenChange,
  onSuccess,
}: CategoryFormDialogProps) {
  const createMutation = useCreateCourseCategory()
  const updateMutation = useUpdateCourseCategory()
  const [apiError, setApiError] = useState<string | null>(null)

  const isEdit = Boolean(initial)
  const pending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: PRESET_COLORS[0],
      icon: '',
      sort_order: 0,
      show_in_mini_program: true,
    },
  })

  const color = watch('color')
  const showInMini = watch('show_in_mini_program')

  useEffect(() => {
    if (!open) return
    setApiError(null)
    reset({
      name: initial?.name ?? '',
      color: initial?.color ?? PRESET_COLORS[0],
      icon: initial?.icon ?? '',
      sort_order: initial?.sort_order ?? 0,
      show_in_mini_program: initial?.show_in_mini_program ?? true,
    })
  }, [open, initial, reset])

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.CATEGORY_NAME_DUPLICATED:
          return '该分类名称已存在'
        case ErrorCodes.CATEGORY_NOT_FOUND:
          return '分类不存在或已被删除'
        default:
          return err.message || '操作失败，请重试'
      }
    }
    return '操作失败，请重试'
  }

  const onSubmit = async (data: CategoryForm) => {
    setApiError(null)
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          data: {
            name: data.name,
            color: data.color || null,
            icon: data.icon || null,
            sort_order: data.sort_order,
            show_in_mini_program: data.show_in_mini_program,
          },
        })
        toast.success('分类已更新')
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          color: data.color || undefined,
          icon: data.icon || undefined,
          sort_order: data.sort_order,
          show_in_mini_program: data.show_in_mini_program,
        })
        toast.success('分类已创建')
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      const msg = mapApiError(err)
      // CATEGORY_NAME_DUPLICATED is a per-field conflict — show inline + toast
      // so the user sees it whether or not the dialog is in focus (mirrors the
      // QUOTA dual-display convention).
      if (
        err instanceof ApiErrorClass &&
        err.code === ErrorCodes.CATEGORY_NAME_DUPLICATED
      ) {
        toast.error(msg)
      }
      setApiError(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="category-form">
          <DialogHeader>
            <DialogTitle>{isEdit ? '编辑课程分类' : '新增课程分类'}</DialogTitle>
            <DialogDescription>
              分类用于组织课程模板，并可控制是否在小程序中展示。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称 *</Label>
              <Input
                id="name"
                {...register('name')}
                data-testid="category-field-name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>颜色</Label>
              <div
                className="flex flex-wrap items-center gap-2"
                data-testid="category-color-picker"
              >
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('color', c, { shouldDirty: true })}
                    aria-label={`选择颜色 ${c}`}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      color === c
                        ? 'border-slate-900 scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <Input
                  className="w-28"
                  placeholder="#2563eb"
                  {...register('color')}
                  data-testid="category-field-color"
                />
              </div>
              {errors.color && (
                <p className="text-sm text-destructive">
                  {errors.color.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">图标标识（可选）</Label>
                <Input
                  id="icon"
                  placeholder="如 yoga"
                  {...register('icon')}
                  data-testid="category-field-icon"
                />
                {errors.icon && (
                  <p className="text-sm text-destructive">
                    {errors.icon.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">排序值</Label>
                <Input
                  id="sort_order"
                  type="number"
                  {...register('sort_order')}
                  data-testid="category-field-sort"
                />
                {errors.sort_order && (
                  <p className="text-sm text-destructive">
                    {errors.sort_order.message}
                  </p>
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
                data-testid="category-field-show-mini"
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
            <Button
              type="submit"
              disabled={pending}
              data-testid="category-submit"
            >
              {pending ? '保存中...' : isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
