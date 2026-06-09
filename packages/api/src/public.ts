import { useMutation, useQuery } from '@tanstack/react-query'
import { http } from './client'

export function useRequestSignupSMSCode() {
  return useMutation<void, Error, { phone: string }>({
    mutationFn: (data) =>
      http.post<void>('/api/v1/public/signup/sms-code', data),
  })
}

export interface SaaSPlan {
  id: number
  name: string
  description: string
  monthly_price: string
  yearly_price: string
  yearly_discount_pct: string | null
  currency: string
  max_locations: number
  max_staff_seats: number
  max_learners: number
}

export interface SignupOrderResult {
  brand_id: number
  brand_name: string
  order: { id: number; status: string; amount: string }
}

export function usePreValidateSignup() {
  return useMutation<void, Error, { phone: string; sms_code: string; password: string }>({
    mutationFn: (data) =>
      http.post<void>('/api/v1/public/signup/pre-validate', data),
  })
}

export function usePublicSaaSPlans() {
  return useQuery<SaaSPlan[]>({
    queryKey: ['public-saas-plans'],
    queryFn: () => http.get<SaaSPlan[]>('/api/v1/public/saas-plans'),
  })
}

export function useCreateSignupOrder() {
  return useMutation<
    SignupOrderResult,
    Error,
    {
      phone: string
      sms_code: string
      password: string
      brand_name: string
      logo_url?: string
      contact_name: string
      contact_email?: string
      industry_type?: string
      plan_id: number
      billing_cycle: 'monthly' | 'yearly'
      payment_channel: 'wechat'
    }
  >({
    mutationFn: (data) =>
      http.post<SignupOrderResult>('/api/v1/public/signup/orders', data),
  })
}

export interface NativePayResult {
  code_url: string
  expires_at: string
}

export interface OrderPaymentStatus {
  status: string
  paid_at: string | null
}

export function useCreateNativePay() {
  return useMutation<NativePayResult, Error, { order_id: number }>({
    mutationFn: (data) =>
      http.post<NativePayResult>('/api/v1/public/payment/native', data),
  })
}

export function useOrderPaymentStatus(orderId: string | null, enabled = true) {
  return useQuery<OrderPaymentStatus>({
    queryKey: ['order-payment-status', orderId],
    queryFn: () =>
      http.get<OrderPaymentStatus>(`/api/v1/public/payment/orders/${orderId}`, { silent: true }),
    enabled: !!orderId && enabled,
    refetchInterval: 3000,
    retry: 3,
  })
}
