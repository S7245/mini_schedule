'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppProfile, useUpdateProfile } from '@mini-schedule/api/app'
import { useAuthStore } from '@mini-schedule/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'

const profileSchema = z.object({
  nickname: z.string().min(2, '昵称至少 2 个字符'),
  avatar_url: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { logout } = useAuthStore()
  const { data } = useAppProfile()
  const updateMutation = useUpdateProfile()
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nickname: data?.nickname ?? '', avatar_url: data?.avatar_url ?? '' },
    values: editing ? undefined : { nickname: data?.nickname ?? '', avatar_url: data?.avatar_url ?? '' },
  })

  const onSubmit = async (formData: ProfileForm) => {
    await updateMutation.mutateAsync(formData)
    setEditing(false)
  }

  return (
    <ProtectedLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">个人中心</h1>
          {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>编辑</Button>}
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            {data?.avatar_url ? (
              <img src={data.avatar_url} alt="avatar" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {(data?.nickname || 'U').charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg">{data?.nickname || '未设置昵称'}</p>
              <p className="text-sm text-muted-foreground">
                {data?.vip_level === 'vip' ? '👑 VIP 会员' : '普通用户'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        {editing ? (
          <Card>
            <CardHeader><CardTitle>编辑资料</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">昵称</Label>
                  <Input id="nickname" {...register('nickname')} defaultValue={data?.nickname} />
                  {errors.nickname && <p className="text-sm text-destructive">{errors.nickname.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">头像 URL</Label>
                  <Input id="avatar_url" placeholder="https://..." {...register('avatar_url')} defaultValue={data?.avatar_url ?? ''} />
                  {errors.avatar_url && <p className="text-sm text-destructive">{errors.avatar_url.message}</p>}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>取消</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? '保存中...' : '保存'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">手机号</span><span className="text-sm">{data?.phone ?? '未绑定'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">品牌 ID</span><span className="text-sm">{data?.brand_id ?? '-'}</span></div>
            </CardContent>
          </Card>
        )}

        <Button variant="destructive" className="w-full" onClick={() => { logout(); window.location.href = '/login' }}>
          退出登录
        </Button>
      </div>
    </ProtectedLayout>
  )
}
