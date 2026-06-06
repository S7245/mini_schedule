'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useBrandProfile, useUpdateBrandProfile } from '@mini-schedule/api/brand-profile'
import { useBrandOnboardingStatus } from '@mini-schedule/api/onboarding'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import {
  ONBOARDING_STEP_KEYS,
  ONBOARDING_STEP_ROUTES,
  WizardShell,
} from '@/components/onboarding/wizard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const INDUSTRY_OPTIONS = [
  { value: 'fitness', label: '健身' },
  { value: 'yoga', label: '瑜伽 / 普拉提' },
  { value: 'dance', label: '舞蹈' },
  { value: 'martial_arts', label: '武术 / 搏击' },
  { value: 'swimming', label: '游泳' },
  { value: 'kids', label: '少儿 / 兴趣班' },
  { value: 'language', label: '语言培训' },
  { value: 'other', label: '其他' },
]

const brandProfileSchema = z.object({
  description: z
    .string()
    .min(1, '请填写品牌简介')
    .max(2000, '最多 2000 字'),
  industry_type: z.string().min(1, '请选择行业类型'),
  logo_url: z
    .string()
    .url('请输入有效的 URL')
    .optional()
    .or(z.literal('')),
  brand_code: z
    .string()
    .max(50, '品牌代码最多 50 个字符')
    .optional()
    .or(z.literal('')),
  contact_email: z
    .string()
    .email('请输入有效的邮箱')
    .optional()
    .or(z.literal('')),
})

type BrandProfileForm = z.infer<typeof brandProfileSchema>

export default function BrandProfileStepPage() {
  const router = useRouter()
  const profileQuery = useBrandProfile()
  const statusQuery = useBrandOnboardingStatus()
  const updateMutation = useUpdateBrandProfile()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BrandProfileForm>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      description: '',
      industry_type: '',
      logo_url: '',
      brand_code: '',
      contact_email: '',
    },
  })

  // Hydrate from server profile
  useEffect(() => {
    const p = profileQuery.data
    if (!p) return
    reset({
      description: p.description ?? '',
      industry_type: p.industry_type ?? '',
      logo_url: p.logo_url ?? '',
      brand_code: p.brand_code ?? '',
      contact_email: p.contact_email ?? '',
    })
  }, [profileQuery.data, reset])

  const onSubmit = async (data: BrandProfileForm) => {
    setApiError(null)
    try {
      await updateMutation.mutateAsync({
        description: data.description,
        industry_type: data.industry_type,
        logo_url: data.logo_url || undefined,
        brand_code: data.brand_code || undefined,
        contact_email: data.contact_email || undefined,
      })
      toast.success('品牌资料已保存')
      router.push(ONBOARDING_STEP_ROUTES.location)
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === ErrorCodes.BRAND_CODE_DUPLICATED) {
          setApiError('品牌代码已被占用，请更换')
          return
        }
        setApiError(err.message || '保存失败，请重试')
        return
      }
      setApiError('保存失败，请重试')
    }
  }

  const steps = statusQuery.data?.steps ?? []
  const profile = profileQuery.data
  const contactEmailReadonly = Boolean(profile?.contact_email)

  return (
    <WizardShell
      currentStepKey="brand_profile"
      steps={steps}
      title="完善品牌资料"
      description="填写后将在小程序、门店页与员工端展示。"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        data-testid="brand-profile-form"
      >
        <div className="space-y-2">
          <Label htmlFor="description">品牌简介 *</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder="简要介绍你的品牌、特色课程或品牌故事"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry_type">行业类型 *</Label>
          <Controller
            control={control}
            name="industry_type"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <SelectTrigger id="industry_type">
                  <SelectValue placeholder="选择行业" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.industry_type && (
            <p className="text-sm text-destructive">{errors.industry_type.message}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logo_url">品牌 Logo URL</Label>
            <Input
              id="logo_url"
              type="url"
              placeholder="https://..."
              {...register('logo_url')}
            />
            {errors.logo_url && (
              <p className="text-sm text-destructive">{errors.logo_url.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand_code">品牌代码（可选）</Label>
            <Input
              id="brand_code"
              placeholder="如 mini-fit-001"
              {...register('brand_code')}
            />
            {errors.brand_code && (
              <p className="text-sm text-destructive">{errors.brand_code.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">联系邮箱</Label>
          <Input
            id="contact_email"
            type="email"
            placeholder="brand@example.com"
            readOnly={contactEmailReadonly}
            {...register('contact_email')}
          />
          {contactEmailReadonly ? (
            <p className="text-xs text-muted-foreground">
              邮箱已在注册时填写，如需修改请联系平台
            </p>
          ) : null}
          {errors.contact_email && (
            <p className="text-sm text-destructive">{errors.contact_email.message}</p>
          )}
        </div>

        {apiError ? (
          <p
            data-testid="api-error"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {apiError}
          </p>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            第 1 步为必填，无法跳过
          </p>
          <Button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
          >
            {isSubmitting || updateMutation.isPending ? '保存中...' : '保存并继续'}
          </Button>
        </div>
      </form>
    </WizardShell>
  )
}

// Help tree-shaking ensure step keys are referenced when sidebar-only is used.
void ONBOARDING_STEP_KEYS
