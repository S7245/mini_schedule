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

export type BrandOnboardingStatus =
  | 'not_started'
  | 'in_progress'
  | 'skipped_partial'
  | 'completed'

export interface Brand {
  id: string
  name: string
  logo_url: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  description?: string | null
  industry_type?: string | null
  brand_code?: string | null
  status: BrandStatus
  onboarding_status?: BrandOnboardingStatus
  onboarding_completed_at?: string | null
  created_at: string
  updated_at: string
}

export type BrandProfile = Brand

export interface UpdateBrandProfileInput {
  logo_url?: string | null
  description?: string | null
  industry_type?: string | null
  brand_code?: string | null
  contact_email?: string | null
}

// ─── Onboarding ──────────────────────────────────────────

export type OnboardingStepKey =
  | 'brand_profile'
  | 'location'
  | 'staff'
  | 'course_category'
  | 'course_template'
  | 'entitlement_template'
  | 'class_session'
  | 'mini_program_qrcode'

export type OnboardingStepStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'skipped'

export interface OnboardingStep {
  step_key: OnboardingStepKey
  status: OnboardingStepStatus
  completed_at: string | null
  skipped_at: string | null
  count: number
  target: number
}

export interface OnboardingStatus {
  overall_status: BrandOnboardingStatus
  steps: OnboardingStep[]
  next_step_key: OnboardingStepKey | null
}

export interface SkipOnboardingStepInput {
  reason?: string
}

export interface SkipOnboardingStepResult {
  step_key: OnboardingStepKey
  status: OnboardingStepStatus
  skipped_at: string | null
}

export interface CompleteOnboardingResult {
  overall_status: BrandOnboardingStatus
  onboarding_completed_at: string | null
}

// ─── Location ────────────────────────────────────────────

export type LocationStatus = 'active' | 'inactive'

export interface Location {
  id: number
  brand_id: number
  name: string
  address: string | null
  phone: string | null
  remark: string | null
  status: LocationStatus
  created_at: string
  updated_at: string
}

export interface CreateLocationInput {
  name: string
  address?: string
  phone?: string
  remark?: string
}

export interface UpdateLocationInput {
  name?: string
  address?: string
  phone?: string
  remark?: string
}

export interface UpdateLocationStatusInput {
  status: LocationStatus
}

// ─── Location Resource (Batch 12a) ───────────────────────

export type LocationResourceStatus = 'active' | 'inactive'
export type LocationResourceStatusFilter = LocationResourceStatus | 'all'
export type LocationResourceType =
  | 'classroom'
  | 'venue'
  | 'online'
  | 'equipment'
  | 'other'

export interface LocationResource {
  id: number
  brand_id: number
  location_id: number
  location_name: string
  name: string
  type: LocationResourceType
  capacity: number
  status: LocationResourceStatus
  remark: string
  created_at: string
  updated_at: string
}

export interface CreateLocationResourceInput {
  location_id: number
  name: string
  type: LocationResourceType
  capacity?: number
  remark?: string
}

export interface UpdateLocationResourceInput {
  name?: string
  type?: LocationResourceType
  capacity?: number
  status?: LocationResourceStatus
  remark?: string
}

export interface LocationResourceListQuery {
  location_id: number
  status?: LocationResourceStatusFilter
  page?: number
  page_size?: number
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

// ─── Course (legacy fitness model — kept only for legacy /trainings refs) ─────

export type CourseType = 'strength' | 'cardio' | 'flexibility' | 'hiit'
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced'

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

// ─── Course Category (Batch 11) ──────────────────────────

export type CourseCategoryStatus = 'active' | 'inactive'
export type CourseCategoryStatusFilter = CourseCategoryStatus | 'all'

export interface CourseCategory {
  id: number
  brand_id: number
  name: string
  color: string | null
  icon: string | null
  sort_order: number
  show_in_mini_program: boolean
  status: CourseCategoryStatus
  created_at: string
  updated_at: string
}

export interface CreateCourseCategoryInput {
  name: string
  color?: string | null
  icon?: string | null
  sort_order?: number
  show_in_mini_program?: boolean
}

export interface UpdateCourseCategoryInput {
  name?: string
  color?: string | null
  icon?: string | null
  sort_order?: number
  show_in_mini_program?: boolean
  status?: CourseCategoryStatus
}

// ─── Course Template (Batch 11 — replaces legacy fitness course CRUD) ─────────

export type CourseStatus = 'draft' | 'published' | 'archived'
export type CourseStatusFilter = CourseStatus | 'all'

/** Lightweight category reference embedded in a course list/detail response. */
export interface CourseCategoryRef {
  id: number
  name: string
  color: string | null
}

/** Row in the /courses list table. Arrays are always present (never omitted). */
export interface CourseTemplateListItem {
  id: number
  title: string
  level_label: string | null
  duration_min: number
  default_capacity: number
  status: CourseStatus
  categories: CourseCategoryRef[]
  available_location_count: number
  show_in_mini_program: boolean
  created_at: string
  updated_at: string
}

/** Full course template detail (GET /courses/:id). */
export interface CourseTemplate {
  id: number
  brand_id: number
  title: string
  description: string | null
  cover_url: string | null
  level_label: string | null
  duration_min: number
  default_capacity: number
  status: CourseStatus
  show_in_mini_program: boolean
  categories: CourseCategoryRef[]
  category_ids: number[]
  available_location_ids: number[]
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateCourseTemplateInput {
  title: string
  description?: string | null
  cover_url?: string | null
  level_label?: string | null
  duration_min: number
  default_capacity: number
  category_ids: number[]
  /** Available locations; empty array = default to all active locations (backend). */
  location_ids: number[]
  show_in_mini_program?: boolean
}

export interface UpdateCourseTemplateInput {
  title?: string
  description?: string | null
  cover_url?: string | null
  level_label?: string | null
  duration_min?: number
  default_capacity?: number
  category_ids?: number[]
  location_ids?: number[]
  show_in_mini_program?: boolean
}

export interface CourseTemplateListQuery {
  page?: number
  page_size?: number
  status?: CourseStatusFilter
  q?: string
  category_id?: number
}

// ─── Class Session (Batch 11) ────────────────────────────

export type ClassSessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
export type ClassSessionStatusFilter = ClassSessionStatus | 'all'

/** Row in the /schedule (class-sessions) list table. */
export interface ClassSessionListItem {
  id: number
  course_id: number
  course_title: string
  location_id: number
  location_name: string
  instructor_profile_id: number
  instructor_name: string
  location_resource_id: number | null
  resource_name: string
  starts_at: string
  ends_at: string
  capacity: number
  booked_count: number
  status: ClassSessionStatus
  created_at: string
  updated_at: string
}

/** Full class session detail (GET /class-sessions/:id). */
export interface ClassSession {
  id: number
  brand_id: number
  course_id: number
  course_title: string
  location_id: number
  location_name: string
  instructor_profile_id: number
  instructor_name: string
  starts_at: string
  ends_at: string
  capacity: number
  booked_count: number
  waitlist_limit: number
  location_resource_id: number | null
  resource_name: string
  status: ClassSessionStatus
  cancel_reason: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateClassSessionInput {
  course_id: number
  location_id: number
  instructor_profile_id: number
  location_resource_id?: number | null
  starts_at: string
  ends_at: string
  capacity?: number
  waitlist_limit?: number
}

export interface CancelClassSessionInput {
  cancel_reason?: string
}

export interface ClassSessionListQuery {
  page?: number
  page_size?: number
  location_id?: number
  course_id?: number
  instructor_profile_id?: number
  status?: ClassSessionStatusFilter
  from?: string
  to?: string
}

/**
 * Schedulable instructor option for the create-session dialog.
 * Source: GET /api/v1/brand/instructors?schedulable=true (assumption — backend
 * must expose instructor_profile_id keyed list; see agent report).
 */
export interface SchedulableInstructor {
  id: number
  display_name: string
  status: InstructorStatus
  is_schedulable: boolean
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

// (Onboarding / BrandProfile / Location types defined earlier in this file)

export type LocationStatusFilter = LocationStatus | 'all'

export interface LocationsQuery {
  page?: number
  page_size?: number
  status?: LocationStatusFilter
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

// ─── Staff / Role / Instructor (Batch 5) ─────────────────

export type StaffStatus = 'active' | 'inactive'
export type StaffStatusFilter = StaffStatus | 'all'

export type RoleScopeType = 'brand' | 'location'
export type DataScope = 'all_brand' | 'role_default' | 'assigned_locations' | 'own_records'
export type LocationAssignmentType = 'member' | 'manager' | 'instructor' | 'assistant'

/**
 * One entry of a Staff's role assignments. `location_id` is REQUIRED when the
 * role's scope_type is 'location', and MUST be null for brand-scoped roles.
 */
export interface RoleAssignment {
  id?: number
  role_id: number
  role_code: string
  role_name: string
  role_scope_type: RoleScopeType
  location_id: number | null
  location_name?: string | null
  data_scope: DataScope
}

export interface CreateRoleAssignmentInput {
  role_code: string
  location_id?: number | null
  data_scope: DataScope
}

export interface LocationAssignment {
  id?: number
  location_id: number
  location_name?: string | null
  assignment_type: LocationAssignmentType
  is_primary: boolean
}

export interface CreateLocationAssignmentInput {
  location_id: number
  assignment_type: LocationAssignmentType
  is_primary: boolean
}

export type InstructorStatus = 'active' | 'inactive'

export interface InstructorProfile {
  id: number
  brand_id: number
  brand_user_id: number
  display_name: string
  avatar_url: string | null
  bio: string | null
  specialties: string[] | null
  certificates: string[] | null
  is_visible_to_learners: boolean
  is_schedulable: boolean
  status: InstructorStatus
  created_at: string
  updated_at: string
}

export interface UpsertInstructorProfileInput {
  display_name: string
  avatar_url?: string | null
  bio?: string | null
  specialties?: string[] | null
  certificates?: string[] | null
  is_visible_to_learners: boolean
  is_schedulable: boolean
  status: InstructorStatus
}

export interface Staff {
  id: number
  brand_id: number
  phone: string
  name: string
  status: StaffStatus
  is_owner: boolean
  role_assignments: RoleAssignment[]
  location_assignments: LocationAssignment[]
  instructor_profile?: InstructorProfile | null
  has_instructor: boolean
  created_at: string
  updated_at: string
}

export interface StaffListItem {
  id: number
  brand_id: number
  phone: string
  name: string
  status: StaffStatus
  is_owner: boolean
  role_assignments: RoleAssignment[]
  location_assignments: LocationAssignment[]
  has_instructor: boolean
  instructor_status?: InstructorStatus | null
  created_at: string
  updated_at: string
}

export interface CreateStaffInput {
  phone: string
  name: string
  initial_password: string
  role_codes?: string[]
  location_assignments?: CreateLocationAssignmentInput[]
}

export interface UpdateStaffInput {
  name?: string
}

export interface UpdateStaffStatusInput {
  status: StaffStatus
}

export interface ReplaceRoleAssignmentsInput {
  assignments: CreateRoleAssignmentInput[]
}

export interface ReplaceLocationAssignmentsInput {
  assignments: CreateLocationAssignmentInput[]
}

export interface StaffListQuery {
  page?: number
  page_size?: number
  status?: StaffStatusFilter
  with_instructor?: boolean
  q?: string
}

// ─── Brand Roles (read-only this batch) ──────────────────

export type RoleStatus = 'active' | 'inactive'

export interface BrandRolePermission {
  id: number
  code: string
  domain: string
  action: string
  name: string
  description?: string | null
}

export interface BrandRole {
  id: number
  brand_id: number
  code: string
  name: string
  description: string | null
  scope_type: RoleScopeType
  is_system: boolean
  status: RoleStatus
  permissions: BrandRolePermission[]
  created_at: string
  updated_at: string
}

// ─── Custom Roles CRUD (Batch 7) ─────────────────────────

/**
 * One entry of the permission catalog (`GET /permissions`), grouped by domain.
 */
export interface PermissionGroup {
  domain: string
  permissions: Array<{
    code: string
    action: string
    name: string
    description?: string | null
  }>
}

/**
 * Create payload for a custom role. `code` is generated by the backend.
 *
 * `permission_codes` is ALWAYS a real array (possibly empty = no-permission
 * role). It must never be omitted / sent as null — the backend treats a missing
 * field as "no change", which is wrong on create.
 */
export interface CreateRoleInput {
  name: string
  scope_type: RoleScopeType
  description?: string
  permission_codes: string[]
}

/**
 * Update payload for a custom role. `scope_type` is intentionally absent — it is
 * locked after creation (contract A3). `permission_codes` fully replaces the
 * role's permission set and is always a real array.
 */
export interface UpdateRoleInput {
  name: string
  description?: string
  permission_codes: string[]
}
