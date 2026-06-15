'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRequestSignupSMSCode, usePreValidateSignup } from '@mini-schedule/api/public'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageShell } from '@/components/signup/page-shell'

const signupSchema = z.object({
  phone: z
    .string()
    .min(1, '请输入手机号')
    .regex(/^1[3-9]\d{9}$/, '请输入正确的手机号格式'),
  smsCode: z.string().min(1, '请输入验证码'),
  password: z
    .string()
    .min(8, '密码至少 8 位')
    .regex(/[a-zA-Z]/, '密码必须包含字母')
    .regex(/\d/, '密码必须包含数字'),
  brandName: z.string().min(1, '品牌名称不能为空').max(100, '品牌名称最多 100 个字符'),
  contactName: z.string().min(1, '联系人姓名不能为空').max(50, '联系人姓名最多 50 个字符'),
  email: z.string().optional(),
  industry: z.string().optional(),
})

type SignupForm = z.infer<typeof signupSchema>

const INDUSTRY_OPTIONS = [
  { value: 'fitness', label: '健身' },
  { value: 'yoga', label: '瑜伽' },
  { value: 'dance', label: '舞蹈' },
  { value: 'swimming', label: '游泳' },
  { value: 'martial_arts', label: '武术' },
  { value: 'other', label: '其他' },
]

const SMS_COOLDOWN = 60

export default function SignupPage() {
  const router = useRouter()
  const smsCodeMutation = useRequestSignupSMSCode()
  const preValidateMutation = usePreValidateSignup()

  const [smsCooldown, setSmsCooldown] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string>('')

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      phone: '',
      smsCode: '',
      password: '',
      brandName: '',
      contactName: '',
      email: '',
      industry: '',
    },
  })

  // SMS cooldown timer
  useEffect(() => {
    if (smsCooldown <= 0) return
    const timer = setTimeout(() => setSmsCooldown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [smsCooldown])

  const handleSendSMSCode = async () => {
    const phone = getValues('phone')
    if (!phone) return
    try {
      await smsCodeMutation.mutateAsync({ phone })
      setSmsCooldown(SMS_COOLDOWN)
    } catch {
      // error toast is handled by the http client
    }
  }

  const onSubmit = async (data: SignupForm) => {
    setIsSubmitting(true)
    setApiError('')
    try {
      await preValidateMutation.mutateAsync({
        phone: data.phone,
        sms_code: data.smsCode,
        password: data.password,
      })
      sessionStorage.setItem('signup-form', JSON.stringify(data))
      router.push('/signup/plan')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提交失败，请稍后重试'
      setApiError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell currentStep={0}>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">创建品牌账号</CardTitle>
          <CardDescription>填写以下信息，开始你的课程预约之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 账号信息区 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">账号信息</h3>

              {/* 手机号 */}
              <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              {/* 短信验证码 */}
              <div className="space-y-2">
                <Label htmlFor="smsCode">短信验证码</Label>
                <div className="flex gap-2">
                  <Input
                    id="smsCode"
                    type="text"
                    placeholder="请输入验证码"
                    {...register('smsCode')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    disabled={smsCooldown > 0 || smsCodeMutation.isPending}
                    onClick={handleSendSMSCode}
                  >
                    {smsCooldown > 0
                      ? `${smsCooldown}s 后重发`
                      : smsCodeMutation.isPending
                        ? '发送中...'
                        : '发送验证码'}
                  </Button>
                </div>
                {errors.smsCode && (
                  <p className="text-sm text-destructive">{errors.smsCode.message}</p>
                )}
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-muted-foreground">开发环境验证码：123456</p>
                )}
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请设置密码（至少 6 位）"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* 品牌信息区 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">品牌信息</h3>

              {/* 品牌名称 */}
              <div className="space-y-2">
                <Label htmlFor="brandName">品牌名称</Label>
                <Input
                  id="brandName"
                  type="text"
                  placeholder="请输入品牌名称"
                  {...register('brandName')}
                />
                {errors.brandName && (
                  <p className="text-sm text-destructive">{errors.brandName.message}</p>
                )}
              </div>

              {/* 联系人姓名 */}
              <div className="space-y-2">
                <Label htmlFor="contactName">联系人姓名</Label>
                <Input
                  id="contactName"
                  type="text"
                  placeholder="请输入联系人姓名"
                  {...register('contactName')}
                />
                {errors.contactName && (
                  <p className="text-sm text-destructive">{errors.contactName.message}</p>
                )}
              </div>

              {/* 联系邮箱（选填） */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  联系邮箱
                  <span className="ml-1 text-xs text-muted-foreground">（选填）</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入联系邮箱"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* 行业类型（选填） */}
              <div className="space-y-2">
                <Label htmlFor="industry">
                  行业类型
                  <span className="ml-1 text-xs text-muted-foreground">（选填）</span>
                </Label>
                <Controller
                  name="industry"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="请选择行业类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* API 错误内联展示 */}
            {apiError && (
              <p className="text-sm text-destructive" data-testid="api-error">{apiError}</p>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '处理中...' : '下一步：选择套餐'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
