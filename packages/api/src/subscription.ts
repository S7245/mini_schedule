import { useQuery } from '@tanstack/react-query'
import { http } from './client'

// Batch 21 — 品牌自己的订阅状态（受限/续费 banner 用）。

export type BrandSubscriptionStatus =
  | 'active'
  | 'grace_period'
  | 'restricted'
  | 'frozen'
  | 'expired'
  | 'cancelled'

export interface MySubscription {
  id: number
  status: BrandSubscriptionStatus
  expires_at: string
  grace_ends_at?: string | null
  plan_id: number
  max_locations: number
  max_staff_seats: number
  max_learners: number
  frozen_reason?: string
}

// 无订阅时后端返回 data:null → 这里得到 null。
export function useMySubscription(enabled = true) {
  return useQuery<MySubscription | null>({
    queryKey: ['brand-my-subscription'],
    queryFn: () =>
      http.get<MySubscription | null>('/api/v1/brand/subscription', {
        silent: true,
      }),
    enabled,
    staleTime: 60_000,
  })
}
