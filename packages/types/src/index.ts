/**
 * Shared TypeScript types — non-API types
 * API types are auto-generated in @mini-schedule/api/generated
 */

// ─── Pagination ──────────────────────────────────────────

export interface PageRequest {
  page: number
  page_size: number
}

export interface PageResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ─── Brand ───────────────────────────────────────────────

export type BrandStatus = 'active' | 'suspended' | 'pending'

export interface Brand {
  id: string
  name: string
  logo_url: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  status: BrandStatus
  created_at: string
  updated_at: string
}

// ─── User ────────────────────────────────────────────────

export interface BrandUser {
  id: string
  brand_id: string
  phone: string
  nickname: string | null
  role: 'admin'
  created_at: string
  updated_at: string
}

export interface AppUser {
  id: string
  brand_id: string
  openid: string | null
  unionid: string | null
  phone: string | null
  nickname: string | null
  avatar_url: string | null
  role: 'normal' | 'vip'
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  username: string
  nickname: string | null
  role: 'super_admin' | 'operator' | 'support'
  created_at: string
  updated_at: string
}

// ─── Course ──────────────────────────────────────────────

export type CourseType = 'strength' | 'cardio' | 'flexibility' | 'hiit'
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type CourseStatus = 'draft' | 'published' | 'archived'

export interface Course {
  id: string
  brand_id: string
  title: string
  description: string
  type: CourseType
  difficulty: CourseDifficulty
  duration_min: number
  calorie_estimate: number | null
  status: CourseStatus
  cover_url: string | null
  created_at: string
  updated_at: string
}

// ─── Training ────────────────────────────────────────────

export interface TrainingRecord {
  id: string
  user_id: string
  course_id: string | null
  brand_id: string
  duration_minutes: number
  calories_burned: number | null
  notes: string | null
  trained_at: string
  created_at: string
}

// ─── UI State ────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system'

export interface SidebarState {
  collapsed: boolean
  activeSection: string | null
}

// ─── API Input Types (mirrors backend DTOs) ──────────────

export interface CreateAppUserInput {
  phone: string
  password: string
  name: string
}

export interface CreateCourseInput {
  title: string
  description?: string
  cover_url?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_min: number
  type: 'strength' | 'cardio' | 'flexibility' | 'hiit'
}

export interface UpdateCourseInput {
  title?: string
  description?: string
  cover_url?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  duration_min?: number
  type?: 'strength' | 'cardio' | 'flexibility' | 'hiit'
}

export interface CreateTrainingInput {
  course_id: string
  duration_min: number
  calories?: number
  notes?: string
}

export interface CreateBrandInput {
  name: string
  logo_url?: string
  contact_name: string
  contact_phone: string
}

export interface CreateAdminInput {
  username: string
  password: string
  role: 'super_admin' | 'operator' | 'support'
}

// ─── Platform Commercialization ─────────────────────────

export type SaaSPlanStatus = 'active' | 'inactive'
export type BillingCycle = 'monthly' | 'yearly'
export type PaymentChannel = 'wechat' | 'alipay'
export type SaaSPlanOrderStatus = 'pending_payment' | 'paid' | 'closed' | 'failed' | 'refunding' | 'refunded' | 'exception'
export type BrandSubscriptionStatus = 'active' | 'grace_period' | 'restricted' | 'frozen' | 'expired' | 'cancelled'
export type PaymentTransactionStatus = 'pending' | 'succeeded' | 'failed' | 'closed' | 'refunding' | 'refunded' | 'exception'
export type PaymentCallbackLogStatus = 'received' | 'processed' | 'failed' | 'ignored'

export interface SaaSPlanFeature {
  id: string
  plan_id: string
  feature_code: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface SaaSPlan {
  id: string
  name: string
  description: string
  monthly_price: string
  yearly_price: string
  yearly_discount_pct?: string | null
  currency: string
  max_locations: number
  max_staff_seats: number
  max_learners: number
  status: SaaSPlanStatus
  sort_order: number
  features?: SaaSPlanFeature[]
  created_at: string
  updated_at: string
}

export interface CreateSaaSPlanInput {
  name: string
  description?: string
  monthly_price: string
  yearly_price: string
  yearly_discount_pct?: string
  currency?: string
  max_locations: number
  max_staff_seats: number
  max_learners: number
  sort_order?: number
  features?: Array<{ feature_code: string; enabled: boolean }>
}

export interface PlatformSummary {
  brand_total: number
  pending_brand_total: number
  active_brand_total: number
  active_subscription_total: number
  expiring_in_7_days_total: number
  restricted_or_frozen_total: number
  today_order_total: number
  today_paid_amount: string
  exception_order_total: number
  failed_callback_total: number
}

export interface SaaSPlanOrder {
  id: string
  brand_id: string
  brand_user_id?: string | null
  plan_id: string
  source: string
  billing_cycle: BillingCycle
  amount: string
  currency: string
  payment_channel: PaymentChannel
  status: SaaSPlanOrderStatus
  out_trade_no: string
  third_party_trade_no?: string
  wechat_code_url?: string
  wechat_prepay_id?: string
  payment_expires_at?: string
  paid_at?: string
  closed_at?: string
  failure_reason?: string
  created_at: string
  updated_at: string
}

export interface BrandSubscriptionFeature {
  id: string
  subscription_id: string
  feature_code: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface BrandSubscription {
  id: string
  brand_id: string
  plan_id: string
  order_id?: string | null
  billing_cycle: BillingCycle
  status: BrandSubscriptionStatus
  starts_at: string
  expires_at: string
  grace_ends_at?: string | null
  max_locations: number
  max_staff_seats: number
  max_learners: number
  frozen_reason?: string
  features?: BrandSubscriptionFeature[]
  created_at: string
  updated_at: string
}

export interface PaymentTransaction {
  id: string
  brand_id?: string | null
  order_id?: string | null
  payment_channel: PaymentChannel
  transaction_type: 'payment' | 'refund'
  status: PaymentTransactionStatus
  amount: string
  currency: string
  out_trade_no: string
  third_party_trade_no?: string
  provider_request_id?: string
  callback_received_at?: string
  paid_at?: string
  failure_reason?: string
  created_at: string
  updated_at: string
}

export interface PaymentCallbackLog {
  id: string
  brand_id?: string | null
  order_id?: string | null
  transaction_id?: string | null
  payment_channel: PaymentChannel
  out_trade_no?: string
  third_party_trade_no?: string
  callback_request_id?: string
  status: PaymentCallbackLogStatus
  processed_at?: string
  error_message?: string
  created_at: string
}

export interface OperationLog {
  id: string
  brand_id?: string | null
  actor_type: string
  actor_id?: string | null
  action: string
  target_type?: string
  target_id?: string | null
  reason?: string
  metadata?: unknown
  created_at: string
}
