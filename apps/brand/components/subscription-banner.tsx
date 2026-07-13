'use client'

import { AlertTriangle, Clock } from 'lucide-react'
import {
  useMySubscription,
  type MySubscription,
} from '@mini-schedule/api/subscription'

const EXPIRING_SOON_DAYS = 7

function formatDay(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('zh-CN')
}

function daysUntil(iso: string): number {
  const d = new Date(iso).getTime()
  if (Number.isNaN(d)) return Infinity
  return Math.ceil((d - Date.now()) / (24 * 60 * 60 * 1000))
}

type BannerContent = { tone: 'danger' | 'warning'; text: string } | null

// 按订阅状态派生 banner。active 且未临近到期 / 无订阅 → 不显示。
function deriveBanner(sub: MySubscription | null | undefined): BannerContent {
  if (!sub) return null
  switch (sub.status) {
    case 'restricted':
      return { tone: 'danger', text: '订阅已受限：新增门店 / 员工 / 学员等操作已被限制，请联系平台续期以恢复。' }
    case 'expired':
      return { tone: 'danger', text: '订阅已过期，相关功能已停用，请联系平台续期。' }
    case 'frozen':
      return {
        tone: 'danger',
        text: `订阅已被冻结${sub.frozen_reason ? `（${sub.frozen_reason}）` : ''}，请联系平台处理。`,
      }
    case 'grace_period': {
      const until = formatDay(sub.grace_ends_at)
      return {
        tone: 'warning',
        text: `订阅已到期，当前处于宽限期${until ? `（至 ${until}）` : ''}，请尽快联系平台续期，以免功能受限。`,
      }
    }
    case 'active': {
      const left = daysUntil(sub.expires_at)
      if (left <= EXPIRING_SOON_DAYS) {
        return {
          tone: 'warning',
          text: `订阅将于 ${formatDay(sub.expires_at)} 到期（剩 ${Math.max(left, 0)} 天），请及时联系平台续期。`,
        }
      }
      return null
    }
    default:
      return null
  }
}

const toneClass: Record<'danger' | 'warning', string> = {
  danger: 'border-red-300 bg-red-50 text-red-800',
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
}

// SubscriptionBanner 品牌订阅受限 / 到期续费提示条，渲染在受保护布局顶部（Batch 21）。
export function SubscriptionBanner() {
  const { data } = useMySubscription()
  const banner = deriveBanner(data)
  if (!banner) return null

  const Icon = banner.tone === 'danger' ? AlertTriangle : Clock
  return (
    <div
      role="status"
      className={`flex items-start gap-2 border-b px-6 py-2.5 text-sm ${toneClass[banner.tone]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{banner.text}</span>
    </div>
  )
}
