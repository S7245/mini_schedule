'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useUpdateBrandStaff } from '@mini-schedule/api/staff'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type { Staff } from '@mini-schedule/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const basicSchema = z.object({
  name: z.string().min(1, '请输入姓名').max(50, '姓名最多 50 个字符'),
})
type BasicForm = z.infer<typeof basicSchema>

const STATUS_LABELS: Record<string, string> = {
  active: '启用',
  inactive: '停用',
}

export interface StaffBasicInfoCardProps {
  staff: Staff
}

export function StaffBasicInfoCard({ staff }: StaffBasicInfoCardProps) {
  const [editing, setEditing] = useState(false)
  const updateMutation = useUpdateBrandStaff()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BasicForm>({
    resolver: zodResolver(basicSchema),
    defaultValues: { name: staff.name },
  })

  useEffect(() => {
    if (!editing) reset({ name: staff.name })
  }, [editing, staff.name, reset])

  const onSubmit = async (data: BasicForm) => {
    if (data.name === staff.name) {
      setEditing(false)
      return
    }
    try {
      await updateMutation.mutateAsync({ id: staff.id, data: { name: data.name } })
      toast.success('员工资料已更新')
      setEditing(false)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        toast.error(err.message || '更新失败')
      } else {
        toast.error('更新失败')
      }
    }
  }

  return (
    <Card data-testid="staff-basic-info">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">基础信息</CardTitle>
        {!editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            data-testid="staff-basic-edit"
          >
            编辑
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {editing ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={updateMutation.isPending}
              >
                取消
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">姓名</dt>
              <dd className="mt-0.5 font-medium">{staff.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">手机号</dt>
              <dd className="mt-0.5 font-medium">{staff.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">状态</dt>
              <dd className="mt-0.5 font-medium">
                {STATUS_LABELS[staff.status] ?? staff.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">品牌负责人</dt>
              <dd className="mt-0.5 font-medium">
                {staff.is_owner ? '是' : '否'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">创建时间</dt>
              <dd className="mt-0.5 font-medium">
                {new Date(staff.created_at).toLocaleString('zh-CN')}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
