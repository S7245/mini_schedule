'use client'

import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { useCreateBrandStaff } from '@mini-schedule/api/staff'
import { useBrandRoles } from '@mini-schedule/api/roles'
import { useBrandLocations } from '@mini-schedule/api/locations'
import {
  ApiErrorClass,
  ErrorCodes,
  getQuotaDetails,
} from '@mini-schedule/api/errors'
import type { LocationAssignmentType } from '@mini-schedule/types'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ASSIGNMENT_TYPES: Array<{
  value: LocationAssignmentType
  label: string
}> = [
  { value: 'member', label: '普通成员' },
  { value: 'manager', label: '店长' },
  { value: 'instructor', label: '教练' },
  { value: 'assistant', label: '协助' },
]

const staffSchema = z
  .object({
    phone: z
      .string()
      .regex(/^1[3-9]\d{9}$/, '请输入合法的 11 位手机号'),
    name: z.string().min(1, '请输入姓名').max(50, '姓名最多 50 个字符'),
    initial_password: z
      .string()
      .min(8, '初始密码至少 8 位')
      .max(64, '初始密码最多 64 位')
      .regex(/[A-Za-z]/, '密码需包含字母')
      .regex(/\d/, '密码需包含数字'),
    role_codes: z.array(z.string()).optional(),
    location_assignments: z
      .array(
        z.object({
          location_id: z.number().int().positive('请选择门店'),
          assignment_type: z.enum([
            'member',
            'manager',
            'instructor',
            'assistant',
          ]),
          is_primary: z.boolean(),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      const primaries = (data.location_assignments ?? []).filter(
        (a) => a.is_primary,
      )
      return primaries.length <= 1
    },
    { message: '最多只能设置 1 个主门店', path: ['location_assignments'] },
  )

type StaffForm = z.infer<typeof staffSchema>

export interface StaffCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function StaffCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: StaffCreateDialogProps) {
  const createMutation = useCreateBrandStaff()
  const rolesQuery = useBrandRoles(open)
  const locationsQuery = useBrandLocations(1, 100, 'active')

  const [apiError, setApiError] = useState<string | null>(null)
  const [quota, setQuota] = useState<{ current: number; max: number } | null>(
    null,
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      phone: '',
      name: '',
      initial_password: '',
      role_codes: [],
      location_assignments: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'location_assignments',
  })

  useEffect(() => {
    if (!open) return
    setApiError(null)
    setQuota(null)
    reset({
      phone: '',
      name: '',
      initial_password: '',
      role_codes: [],
      location_assignments: [],
    })
  }, [open, reset])

  // Roles available for manual assignment — exclude brand_owner (owner role is
  // backend-managed only, attempting to assign returns INVALID_PARAM).
  const assignableRoles = (rolesQuery.data ?? []).filter(
    (r) => r.code !== 'brand_owner' && r.status === 'active',
  )

  const selectedRoles = watch('role_codes') ?? []

  function toggleRole(code: string) {
    const current = selectedRoles
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code]
    setValue('role_codes', next, { shouldDirty: true })
  }

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.STAFF_PHONE_DUPLICATED:
          return '该手机号已被其他员工使用'
        case ErrorCodes.QUOTA_EXCEEDED: {
          const q = getQuotaDetails(err)
          if (q) {
            return `员工席位已达套餐上限（已用 ${q.current}/${q.max}），请联系平台升级套餐`
          }
          return '员工席位已达套餐上限，请联系平台升级套餐'
        }
        case ErrorCodes.SUBSCRIPTION_RESTRICTED:
          return '订阅状态异常，暂无法新增员工'
        case ErrorCodes.ROLE_NOT_FOUND:
          return '所选角色不存在或已停用'
        case ErrorCodes.LOCATION_ASSIGNMENT_INVALID:
          return '所选门店任职不可用，请检查门店列表'
        case ErrorCodes.INVALID_PARAM:
          return err.message || '请求参数不合法'
        default:
          return err.message || '新增员工失败，请重试'
      }
    }
    return '新增员工失败，请重试'
  }

  const onSubmit = async (data: StaffForm) => {
    setApiError(null)
    setQuota(null)
    try {
      await createMutation.mutateAsync({
        phone: data.phone,
        name: data.name,
        initial_password: data.initial_password,
        role_codes: data.role_codes && data.role_codes.length > 0
          ? data.role_codes
          : undefined,
        location_assignments:
          data.location_assignments && data.location_assignments.length > 0
            ? data.location_assignments.map((a) => ({
                location_id: a.location_id,
                assignment_type: a.assignment_type,
                is_primary: a.is_primary,
              }))
            : undefined,
      })
      toast.success('员工已创建')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      const msg = mapApiError(err)
      if (err instanceof ApiErrorClass) {
        if (err.code === ErrorCodes.QUOTA_EXCEEDED) {
          const q = getQuotaDetails(err)
          if (q) setQuota(q)
          toast.error(msg)
          setApiError(msg)
          return
        }
        if (err.code === ErrorCodes.SUBSCRIPTION_RESTRICTED) {
          // review B11：非 quota 错误必须清掉 quota counter，否则旧的 (3/3) 会和新错误并列显示
          setQuota(null)
          toast.error(msg)
          setApiError(msg)
          return
        }
      }
      // review B11：所有其他错误（phone 重复 / role 不存在 / 后端 500 等）同样清 quota state
      setQuota(null)
      setApiError(msg)
    }
  }

  const pending = createMutation.isPending
  const availableLocations = locationsQuery.data?.items ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="staff-create-form">
          <DialogHeader>
            <DialogTitle>新增员工</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                员工创建后会收到一个可登录品牌后台的账号，可在详情页补充角色 /
                教练档案。
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-5 overflow-y-auto py-4 pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">手机号 *</Label>
                <Input
                  id="phone"
                  placeholder="11 位手机号"
                  inputMode="numeric"
                  {...register('phone')}
                  data-testid="staff-field-phone"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  placeholder="员工真实姓名"
                  {...register('name')}
                  data-testid="staff-field-name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="initial_password">初始密码 *</Label>
                <Input
                  id="initial_password"
                  type="password"
                  placeholder="≥ 8 位，含字母和数字"
                  {...register('initial_password')}
                  data-testid="staff-field-password"
                />
                {errors.initial_password && (
                  <p className="text-sm text-destructive">
                    {errors.initial_password.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  员工首次登录后建议自行修改密码。
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>角色</Label>
                <span className="text-xs text-muted-foreground">
                  可多选，品牌负责人角色由系统自动分配
                </span>
              </div>
              {rolesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">加载角色中...</p>
              ) : assignableRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  暂无可分配角色，可稍后在员工详情中分配
                </p>
              ) : (
                <div
                  className="flex flex-wrap gap-2"
                  data-testid="staff-role-picker"
                >
                  {assignableRoles.map((r) => {
                    const checked = selectedRoles.includes(r.code)
                    return (
                      <button
                        type="button"
                        key={r.code}
                        onClick={() => toggleRole(r.code)}
                        className={
                          checked
                            ? 'inline-flex items-center rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary'
                            : 'inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-primary/40'
                        }
                        data-role-code={r.code}
                      >
                        {r.name}
                        <span className="ml-1 text-[10px] opacity-60">
                          {r.scope_type === 'brand' ? '品牌' : '门店'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>门店任职</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const firstLoc = availableLocations[0]
                    append({
                      location_id: firstLoc ? firstLoc.id : 0,
                      assignment_type: 'member',
                      is_primary: fields.length === 0,
                    })
                  }}
                  data-testid="staff-add-location-assignment"
                  disabled={availableLocations.length === 0}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  添加门店
                </Button>
              </div>
              {availableLocations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  暂无可用门店，请先创建门店
                </p>
              ) : fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  未配置门店任职 — 可稍后在员工详情中补充
                </p>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
                      data-testid={`staff-location-row-${idx}`}
                    >
                      <div className="col-span-5">
                        <Controller
                          control={control}
                          name={`location_assignments.${idx}.location_id`}
                          render={({ field: f }) => (
                            <Select
                              value={f.value ? String(f.value) : ''}
                              onValueChange={(v) => f.onChange(Number(v))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择门店" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableLocations.map((loc) => (
                                  <SelectItem
                                    key={loc.id}
                                    value={String(loc.id)}
                                  >
                                    {loc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="col-span-4">
                        <Controller
                          control={control}
                          name={`location_assignments.${idx}.assignment_type`}
                          render={({ field: f }) => (
                            <Select
                              value={f.value}
                              onValueChange={(v) =>
                                f.onChange(v as LocationAssignmentType)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ASSIGNMENT_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="col-span-2 flex items-center">
                        <Controller
                          control={control}
                          name={`location_assignments.${idx}.is_primary`}
                          render={({ field: f }) => (
                            <label className="flex items-center gap-1 text-xs text-slate-700">
                              <input
                                type="radio"
                                name="staff-primary-location"
                                checked={Boolean(f.value)}
                                onChange={() => {
                                  // ensure single primary
                                  const all = watch('location_assignments') ?? []
                                  all.forEach((_, i) => {
                                    setValue(
                                      `location_assignments.${i}.is_primary`,
                                      i === idx,
                                    )
                                  })
                                }}
                              />
                              主门店
                            </label>
                          )}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => remove(idx)}
                          aria-label="删除该任职"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {errors.location_assignments && (
                    <p className="text-sm text-destructive">
                      {errors.location_assignments.message ??
                        '门店任职配置有误'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {apiError ? (
              <div
                data-testid="api-error"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {apiError}
                {quota ? (
                  <span className="ml-1 text-xs text-destructive/80">
                    （{quota.current}/{quota.max}）
                  </span>
                ) : null}
              </div>
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
              data-testid="staff-create-submit"
            >
              {pending ? '创建中...' : '创建员工'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
