'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, GraduationCap, Sparkles } from 'lucide-react'
import {
  useDeleteStaffInstructor,
  useUpsertStaffInstructor,
} from '@mini-schedule/api/instructor'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type {
  InstructorStatus,
  Staff,
  UpsertInstructorProfileInput,
} from '@mini-schedule/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/common/confirm-dialog'

const instructorSchema = z.object({
  display_name: z
    .string()
    .min(1, '请输入对外展示名称')
    .max(50, '展示名称最多 50 个字符'),
  avatar_url: z
    .string()
    .url('请输入合法的头像 URL')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(1000, '简介最多 1000 个字符').optional().or(z.literal('')),
  // Specialties / certificates are comma-separated in the input box; we split
  // on save so the user doesn't need to manage chips manually for v1.
  specialties_text: z.string().max(500, '专长最多 500 个字符').optional().or(z.literal('')),
  certificates_text: z.string().max(500, '证书最多 500 个字符').optional().or(z.literal('')),
  is_visible_to_learners: z.boolean(),
  is_schedulable: z.boolean(),
  status: z.enum(['active', 'inactive']),
})

type InstructorForm = z.infer<typeof instructorSchema>

function splitCSV(value: string | undefined | null): string[] {
  if (!value) return []
  return value
    .split(/[,，;；]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function joinCSV(value: string[] | null | undefined): string {
  if (!value || value.length === 0) return ''
  return value.join('、')
}

export interface InstructorProfileSectionProps {
  staff: Staff
}

export function InstructorProfileSection({
  staff,
}: InstructorProfileSectionProps) {
  const profile = staff.instructor_profile
  const hasProfile = staff.has_instructor && profile

  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)

  const upsertMutation = useUpsertStaffInstructor()
  const deleteMutation = useDeleteStaffInstructor()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InstructorForm>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      display_name: '',
      avatar_url: '',
      bio: '',
      specialties_text: '',
      certificates_text: '',
      is_visible_to_learners: true,
      is_schedulable: true,
      status: 'active',
    },
  })

  useEffect(() => {
    if (!editing) return
    reset({
      display_name: profile?.display_name ?? staff.name,
      avatar_url: profile?.avatar_url ?? '',
      bio: profile?.bio ?? '',
      specialties_text: joinCSV(profile?.specialties),
      certificates_text: joinCSV(profile?.certificates),
      is_visible_to_learners: profile?.is_visible_to_learners ?? true,
      is_schedulable: profile?.is_schedulable ?? true,
      status: profile?.status ?? 'active',
    })
  }, [editing, profile, staff.name, reset])

  const isVisible = watch('is_visible_to_learners')
  const isSchedulable = watch('is_schedulable')
  const status = watch('status')

  function openCreate() {
    setExpanded(true)
    setEditing(true)
  }

  function openEdit() {
    setEditing(true)
    setExpanded(true)
  }

  function cancel() {
    setEditing(false)
  }

  const onSubmit = async (data: InstructorForm) => {
    const payload: UpsertInstructorProfileInput = {
      display_name: data.display_name,
      avatar_url: data.avatar_url ? data.avatar_url : null,
      bio: data.bio ? data.bio : null,
      specialties: splitCSV(data.specialties_text).length
        ? splitCSV(data.specialties_text)
        : null,
      certificates: splitCSV(data.certificates_text).length
        ? splitCSV(data.certificates_text)
        : null,
      is_visible_to_learners: data.is_visible_to_learners,
      is_schedulable: data.is_schedulable,
      status: data.status,
    }
    try {
      await upsertMutation.mutateAsync({ staffId: staff.id, data: payload })
      toast.success(hasProfile ? '教练档案已更新' : '已晋升为教练')
      setEditing(false)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        toast.error(err.message || '保存失败')
      } else {
        toast.error('保存失败')
      }
    }
  }

  async function confirmDelete() {
    try {
      await deleteMutation.mutateAsync(staff.id)
      toast.success('教练资格已注销')
      setPendingDelete(false)
      setEditing(false)
      setExpanded(false)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        toast.error(err.message || '注销失败')
      } else {
        toast.error('注销失败')
      }
      setPendingDelete(false)
    }
  }

  return (
    <Card data-testid="staff-instructor-section">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <GraduationCap className="h-4 w-4 text-primary" />
            教练档案
          </span>
          {hasProfile ? (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {profile?.status === 'active' ? '已启用' : '已停用'}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">未启用</span>
          )}
        </CardTitle>
      </CardHeader>
      {expanded ? (
        <CardContent className="space-y-3">
          {!hasProfile && !editing ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                该员工尚未启用为教练。晋升为教练后即可用于排课、对外展示和学员预约。
              </p>
              <Button
                type="button"
                size="sm"
                onClick={openCreate}
                data-testid="staff-instructor-promote"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                晋升为教练
              </Button>
            </div>
          ) : null}

          {hasProfile && !editing ? (
            <div className="space-y-3">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">展示名称</dt>
                  <dd className="mt-0.5 font-medium">
                    {profile?.display_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">学员可见</dt>
                  <dd className="mt-0.5 font-medium">
                    {profile?.is_visible_to_learners ? '是' : '否'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">可排课</dt>
                  <dd className="mt-0.5 font-medium">
                    {profile?.is_schedulable ? '是' : '否'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">状态</dt>
                  <dd className="mt-0.5 font-medium">
                    {profile?.status === 'active' ? '启用' : '停用'}
                  </dd>
                </div>
                {profile?.specialties && profile.specialties.length > 0 ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">专长</dt>
                    <dd className="mt-0.5">{profile.specialties.join('、')}</dd>
                  </div>
                ) : null}
                {profile?.certificates && profile.certificates.length > 0 ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">证书</dt>
                    <dd className="mt-0.5">{profile.certificates.join('、')}</dd>
                  </div>
                ) : null}
                {profile?.bio ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">简介</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap">
                      {profile.bio}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openEdit}
                  data-testid="staff-instructor-edit"
                >
                  编辑
                </Button>
                <button
                  type="button"
                  className="text-sm text-destructive hover:underline disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                  onClick={() => setPendingDelete(true)}
                  data-testid="staff-instructor-delete"
                >
                  注销教练资格
                </button>
              </div>
            </div>
          ) : null}

          {editing ? (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-3"
              data-testid="staff-instructor-form"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="display_name">展示名称 *</Label>
                  <Input id="display_name" {...register('display_name')} />
                  {errors.display_name && (
                    <p className="text-sm text-destructive">
                      {errors.display_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="avatar_url">头像 URL</Label>
                  <Input
                    id="avatar_url"
                    placeholder="https://..."
                    {...register('avatar_url')}
                  />
                  {errors.avatar_url && (
                    <p className="text-sm text-destructive">
                      {errors.avatar_url.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="specialties_text">专长（逗号分隔）</Label>
                  <Input
                    id="specialties_text"
                    placeholder="瑜伽, 普拉提"
                    {...register('specialties_text')}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="certificates_text">证书（逗号分隔）</Label>
                  <Input
                    id="certificates_text"
                    placeholder="RYT200, ACE-CPT"
                    {...register('certificates_text')}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="bio">简介</Label>
                  <Textarea id="bio" rows={3} {...register('bio')} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) =>
                      setValue('is_visible_to_learners', e.target.checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                  学员可见
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={isSchedulable}
                    onChange={(e) =>
                      setValue('is_schedulable', e.target.checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                  可排课
                </label>
                <label className="flex items-center gap-1.5">
                  状态
                  <select
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                    value={status}
                    onChange={(e) =>
                      setValue('status', e.target.value as InstructorStatus, {
                        shouldDirty: true,
                      })
                    }
                  >
                    <option value="active">启用</option>
                    <option value="inactive">停用</option>
                  </select>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={upsertMutation.isPending}
                  data-testid="staff-instructor-save"
                >
                  {upsertMutation.isPending
                    ? '保存中...'
                    : hasProfile
                      ? '保存'
                      : '启用教练档案'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={cancel}
                  disabled={upsertMutation.isPending}
                >
                  取消
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      ) : null}

      <ConfirmDialog
        open={pendingDelete}
        title="注销该员工的教练资格？"
        description={
          <span>
            将删除「<span className="font-medium">{staff.name}</span>
            」的教练档案。已排定的课程不会受影响，但该员工将不再用于新排课、不再对学员展示。
          </span>
        }
        confirmText="注销"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setPendingDelete(false)}
        onConfirm={confirmDelete}
      />
    </Card>
  )
}
