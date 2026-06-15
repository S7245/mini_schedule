'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/signup/page-shell'
import { usePublicSaaSPlans, useCreateSignupOrder, type SaaSPlan } from '@mini-schedule/api/public'

type BillingCycle = 'monthly' | 'yearly'

function formatPrice(plan: SaaSPlan, cycle: BillingCycle): string {
  const price = cycle === 'monthly' ? plan.monthly_price : plan.yearly_price
  const unit = cycle === 'monthly' ? '/月' : '/年'
  return `¥${parseFloat(price).toLocaleString()}${unit}`
}

function PlanCard({
  plan,
  cycle,
  selected,
  onSelect,
}: {
  plan: SaaSPlan
  cycle: BillingCycle
  selected: boolean
  onSelect: () => void
}) {
  const limit = (n: number, max = 99) => (n >= max ? '不限' : String(n))

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        selected ? 'border-primary ring-1 ring-primary' : 'hover:border-slate-300'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{plan.name}</CardTitle>
          {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
        </div>
        <p className="text-2xl font-bold text-primary">{formatPrice(plan, cycle)}</p>
        {cycle === 'yearly' && plan.yearly_discount_pct && (
          <span className="text-xs text-green-600">
            年付省 {Math.round(parseFloat(plan.yearly_discount_pct))}%
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{plan.description}</p>
        <div className="mt-2 space-y-0.5 text-xs">
          <p>门店：{limit(plan.max_locations)}</p>
          <p>员工席位：{limit(plan.max_staff_seats, 999)}</p>
          <p>学员：{limit(plan.max_learners, 5000)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SignupPlanPage() {
  const router = useRouter()
  const { data: plans, isLoading } = usePublicSaaSPlans()
  const createOrderMutation = useCreateSignupOrder()

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  useEffect(() => {
    if (!sessionStorage.getItem('signup-form')) {
      router.replace('/signup')
    }
  }, [])

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId)

  const handleSubmit = async () => {
    if (!selectedPlan) return

    const raw = sessionStorage.getItem('signup-form')
    if (!raw) {
      router.push('/signup')
      return
    }

    const form = JSON.parse(raw)
    const result = await createOrderMutation.mutateAsync({
      phone: form.phone,
      sms_code: form.smsCode,
      password: form.password,
      brand_name: form.brandName,
      contact_name: form.contactName,
      contact_email: form.email || undefined,
      industry_type: form.industry || undefined,
      plan_id: selectedPlan.id,
      billing_cycle: cycle,
      payment_channel: 'wechat',
    })

    sessionStorage.removeItem('signup-form')
    router.push(`/signup/payment/${result.order.id}`)
  }

  return (
    <PageShell currentStep={1}>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">选择套餐</CardTitle>
          <CardDescription>选择适合你品牌规模的订阅方案</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 计费周期切换 */}
          <div className="flex gap-2">
            {(['monthly', 'yearly'] as BillingCycle[]).map((c) => (
              <Button
                key={c}
                variant={cycle === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCycle(c)}
              >
                {c === 'monthly' ? '月付' : '年付'}
              </Button>
            ))}
          </div>

          {/* 套餐列表 */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">加载套餐中...</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {plans?.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  cycle={cycle}
                  selected={selectedPlanId === plan.id}
                  onSelect={() => setSelectedPlanId(plan.id)}
                />
              ))}
            </div>
          )}

          {/* 已选摘要 */}
          {selectedPlan && (
            <p className="text-sm text-muted-foreground">
              已选：
              <span className="font-medium text-foreground">
                {selectedPlan.name} · {cycle === 'monthly' ? '月付' : '年付'} ·{' '}
                {formatPrice(selectedPlan, cycle)}
              </span>
            </p>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/signup')}>
              ← 上一步
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedPlan || createOrderMutation.isPending}
              onClick={handleSubmit}
            >
              {createOrderMutation.isPending ? '提交中...' : '立即支付 →'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
