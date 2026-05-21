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
