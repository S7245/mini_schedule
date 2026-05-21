'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppLogin } from '@mini-schedule/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  brand_id: z.coerce.number().min(1, '请选择品牌'),
  code: z.string().min(1, '请输入登录码'),
  nickname: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const loginMutation = useAppLogin()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      brand_id: Number(process.env.NEXT_PUBLIC_DEFAULT_BRAND_ID) || 1,
      code: '',
      nickname: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    try {
      await loginMutation.mutateAsync({
        ...data,
        brand_id: String(data.brand_id),
      })
      router.push('/dashboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">智能健身教练</CardTitle>
          <CardDescription>微信授权登录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand_id">品牌 ID</Label>
              <Input id="brand_id" type="number" {...register('brand_id')} />
              {errors.brand_id && <p className="text-sm text-destructive">{errors.brand_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">登录码</Label>
              <Input id="code" placeholder="微信登录 code" {...register('code')} />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称（选填）</Label>
              <Input id="nickname" placeholder="你的昵称" {...register('nickname')} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || loginMutation.isPending}>
              {isSubmitting || loginMutation.isPending ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
