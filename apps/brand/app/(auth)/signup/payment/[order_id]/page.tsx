'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCreateNativePay, useOrderPaymentStatus } from '@mini-schedule/api/public'
import { PageShell } from '@/components/signup/page-shell'

type PageState = 'loading' | 'pending' | 'success' | 'expired' | 'error'

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.order_id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [codeUrl, setCodeUrl] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState<string>('00:00')
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const createPayMutation = useCreateNativePay()

  const fetchQRCode = useCallback(async () => {
    setPageState('loading')
    try {
      const result = await createPayMutation.mutateAsync({ order_id: parseInt(orderId, 10) })
      setCodeUrl(result.code_url)
      setExpiresAt(new Date(result.expires_at))
      setPageState('pending')
    } catch {
      setPageState('error')
    }
  }, [orderId])

  useEffect(() => { fetchQRCode() }, [fetchQRCode])

  // 倒计时
  useEffect(() => {
    if (!expiresAt || pageState !== 'pending') return
    countdownRef.current = setInterval(() => {
      const remaining = expiresAt.getTime() - Date.now()
      if (remaining <= 0) {
        clearInterval(countdownRef.current!)
        setPageState('expired')
      } else {
        setCountdown(formatCountdown(remaining))
      }
    }, 1000)
    return () => clearInterval(countdownRef.current!)
  }, [expiresAt, pageState])

  // 轮询订单状态
  const { data: statusData } = useOrderPaymentStatus(orderId, pageState === 'pending')
  useEffect(() => {
    if (statusData?.status === 'paid') {
      clearInterval(countdownRef.current!)
      setPageState('success')
    }
  }, [statusData])

  if (pageState === 'loading') {
    return (
      <PageShell>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">正在生成支付二维码...</p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (pageState === 'success') {
    return (
      <PageShell currentStep={3}>
        <Card className="text-center">
          <CardHeader className="space-y-4 pb-2">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <CardTitle className="text-2xl">支付成功！</CardTitle>
            <CardDescription>
              你的品牌账号已激活，请登录后进入初始化向导。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              data-testid="payment-success-to-login"
              onClick={() =>
                router.push(`/login?next=${encodeURIComponent('/onboarding')}`)
              }
            >
              去登录并开始初始化 →
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (pageState === 'expired' || pageState === 'error') {
    return (
      <PageShell>
        <Card className="text-center">
          <CardHeader className="space-y-4 pb-2">
            <Clock className="mx-auto h-16 w-16 text-slate-400" />
            <CardTitle className="text-2xl">
              {pageState === 'expired' ? '二维码已过期' : '获取二维码失败'}
            </CardTitle>
            <CardDescription>
              {pageState === 'expired'
                ? '扫码有效期为 2 小时，请重新获取二维码后再扫码支付。'
                : '网络异常，请稍后重试。'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={fetchQRCode}>
              <RefreshCw className="mr-2 h-4 w-4" />
              重新获取二维码
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  // pending state
  return (
    <PageShell>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">扫码支付</CardTitle>
          <CardDescription>完成注册，扫码支付以激活你的品牌账号</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="rounded-lg border bg-white p-4">
            <QRCodeSVG value={codeUrl} size={200} />
          </div>
          <p className="text-sm text-muted-foreground">
            二维码有效期：
            <span className="font-mono font-semibold text-foreground">{countdown}</span>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            打开微信 → 扫一扫 → 完成支付
          </p>
        </CardContent>
      </Card>
    </PageShell>
  )
}
