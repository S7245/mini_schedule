import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import { ApiErrorClass } from './errors'
import type { Course, TrainingRecord, PageResponse, CreateTrainingInput } from '@mini-schedule/types'

// ─── App Courses ─────────────────────────────────────────

export function useAppCourses(page = 1, pageSize = 20) {
  return useQuery<PageResponse<Course>>({
    queryKey: ['app-courses', page, pageSize],
    queryFn: () =>
      http.get<PageResponse<Course>>(`/api/v1/app/courses?page=${page}&page_size=${pageSize}`),
  })
}

export function useAppCourse(id: string | null) {
  return useQuery<Course>({
    queryKey: ['app-course', id],
    queryFn: () => http.get<Course>(`/api/v1/app/courses/${id}`),
    enabled: !!id,
  })
}

// ─── App Profile ─────────────────────────────────────────

export interface AppProfile {
  id: string
  brand_id: string
  nickname: string
  avatar_url: string | null
  vip_level: string
  phone: string | null
}

export function useAppProfile() {
  return useQuery<AppProfile>({
    queryKey: ['app-profile'],
    queryFn: () => http.get<AppProfile>('/api/v1/app/profile'),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation<AppProfile, Error, { nickname?: string; avatar_url?: string }>({
    mutationFn: (data) => http.put<AppProfile>('/api/v1/app/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-profile'] })
    },
  })
}

// ─── App Trainings ───────────────────────────────────────

export function useAppTrainings(page = 1, pageSize = 20) {
  return useQuery<PageResponse<TrainingRecord>>({
    queryKey: ['app-trainings', page, pageSize],
    queryFn: () =>
      http.get<PageResponse<TrainingRecord>>(`/api/v1/app/trainings?page=${page}&page_size=${pageSize}`),
  })
}

export function useCreateTraining() {
  const queryClient = useQueryClient()
  return useMutation<TrainingRecord, Error, CreateTrainingInput>({
    mutationFn: (data) => http.post<TrainingRecord>('/api/v1/app/trainings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-trainings'] })
    },
  })
}

// ─── 自助预约（Batch 14a）────────────────────────────────
// 后端 /api/v1/app 下，token 自动携带（client 从 localStorage 取 Bearer）。所有"我的"由后端按
// token 的 brand_learner_profile_id 收口，前端不传 learner 参数。

/** 课程表场次（C 端只读，mirror 后端 classsession.Session JSON 的展示子集）。 */
export interface AppClassSession {
  id: number
  course_title: string
  location_name: string
  starts_at: string
  ends_at: string
  capacity: number
  booked_count: number
  status: string
}

/** 预约绑定的权益锁（占位预约为 null）。 */
export interface AppBookingHold {
  id: number
  product_name: string
  status: string
  credits: number
}

/** 我的预约（mirror 后端 booking.Booking JSON 的展示子集）。 */
export interface AppBooking {
  id: number
  class_session_id: number
  source: string
  status: string
  booked_at: string
  cancelled_at: string | null
  cancel_reason: string
  session_starts_at: string
  session_ends_at: string
  session_status: string
  course_title: string
  location_name: string
  hold: AppBookingHold | null
}

/** 预约前权益预览（§5.7 序，auto_selected=true 为将用项）。 */
export interface AppUsableEntitlement {
  entitlement_id: number
  product_name: string
  product_type: string
  remaining_credits: number | null
  expires_at: string
  auto_selected: boolean
}

/** 课程表：brand + scheduled + 未来（soonest first）。 */
export function useAppClassSessions(page = 1, pageSize = 20) {
  return useQuery<PageResponse<AppClassSession>>({
    queryKey: ['app-class-sessions', page, pageSize],
    queryFn: () =>
      http.get<PageResponse<AppClassSession>>(
        `/api/v1/app/class-sessions?page=${page}&page_size=${pageSize}`,
      ),
  })
}

export function useAppClassSession(id: number | null) {
  return useQuery<AppClassSession>({
    queryKey: ['app-class-session', id],
    queryFn: () => http.get<AppClassSession>(`/api/v1/app/class-sessions/${id}`),
    enabled: !!id,
  })
}

/** 我的预约（仅本人；status 可选筛选）。 */
export function useAppBookings(status = '', page = 1, pageSize = 20) {
  const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (status) q.set('status', status)
  return useQuery<PageResponse<AppBooking>>({
    queryKey: ['app-bookings', status, page, pageSize],
    queryFn: () => http.get<PageResponse<AppBooking>>(`/api/v1/app/bookings?${q.toString()}`),
  })
}

/** 预约前权益预览（仅展示，§5.7 学员不自选）。 */
export function useAppUsableEntitlements(sessionId: number | null) {
  return useQuery<AppUsableEntitlement[]>({
    queryKey: ['app-usable-entitlements', sessionId],
    queryFn: () =>
      http.get<AppUsableEntitlement[]>(
        `/api/v1/app/bookings/usable-entitlements?class_session_id=${sessionId}`,
      ),
    enabled: !!sessionId,
  })
}

/** 自助预约（auto/learner_self_service）。失败态由 ApiErrorClass.code 区分（见 appBookingErrorText）。 */
export function useAppCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation<AppBooking, Error, { class_session_id: number }>({
    mutationFn: (data) => http.post<AppBooking>('/api/v1/app/bookings', data, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-class-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['app-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['app-entitlements'] }) // 14b 我的权益
    },
  })
}

/** 自助取消（ownership 由后端 tx 内校验）。 */
export function useAppCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation<AppBooking, Error, { id: number; reason?: string }>({
    mutationFn: ({ id, reason }) =>
      http.post<AppBooking>(`/api/v1/app/bookings/${id}/cancel`, { reason: reason ?? '' }, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['app-class-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['app-entitlements'] })
    },
  })
}

// ─── 我的权益 / 加入候补（Batch 14b）────────────────────

/** 我的权益（mirror 后端 entitlement.Entitlement 展示子集；id 为 number 对齐 int64）。 */
export interface AppEntitlement {
  id: number
  product_id: number
  product_name: string
  product_type: string
  status: string
  total_credits: number | null
  remaining_credits: number | null
  locked_credits: number
  expires_at: string
}

/** 我的候补（mirror 后端 waitlist.Entry 展示子集）。 */
export interface AppWaitlistEntry {
  id: number
  class_session_id: number
  position: number
  status: string
  session_starts_at: string
  course_title: string
  location_name: string
}

/** 我的权益（settle-on-read，过期/耗尽状态正确）。queryKey 与 14a 预约/取消失效键一致 → 下单后即时刷新。 */
export function useAppEntitlements() {
  return useQuery<AppEntitlement[]>({
    queryKey: ['app-entitlements'],
    queryFn: () => http.get<AppEntitlement[]>('/api/v1/app/entitlements'),
  })
}

/** 我的候补（本人活跃候补）。 */
export function useAppWaitlist() {
  return useQuery<AppWaitlistEntry[]>({
    queryKey: ['app-waitlist'],
    queryFn: () => http.get<AppWaitlistEntry[]>('/api/v1/app/waitlist'),
  })
}

/** 满员场次加入候补（self-service，不锁权益）。 */
export function useAppJoinWaitlist() {
  const queryClient = useQueryClient()
  return useMutation<AppWaitlistEntry, Error, { class_session_id: number }>({
    mutationFn: (data) => http.post<AppWaitlistEntry>('/api/v1/app/waitlist', data, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-waitlist'] })
      queryClient.invalidateQueries({ queryKey: ['app-class-sessions'] })
    },
  })
}

/** 自助取消候补（ownership 由后端 tx 内校验）。 */
export function useAppCancelWaitlist() {
  const queryClient = useQueryClient()
  return useMutation<AppWaitlistEntry, Error, { id: number }>({
    mutationFn: ({ id }) => http.post<AppWaitlistEntry>(`/api/v1/app/waitlist/${id}/cancel`, {}, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-waitlist'] })
      queryClient.invalidateQueries({ queryKey: ['app-class-sessions'] })
    },
  })
}

/** 学员视角的失败文案（覆盖 §7.3/§22.1 的不可预约/取消原因 + §22.4 候补）。未知码回退后端 message。 */
const APP_BOOKING_ERROR_TEXT: Record<string, string> = {
  ENTITLEMENT_NONE_AVAILABLE: '你暂无可用权益，请联系机构购买或开通',
  ENTITLEMENT_NOT_USABLE: '权益不可用（已过期/耗尽/冻结），请联系机构',
  ENTITLEMENT_SCOPE_MISMATCH: '权益不适用于该课程',
  SESSION_FULL: '该场次已满员',
  BOOKING_WINDOW_CLOSED: '当前不在可预约时间范围内',
  BOOKING_DUPLICATE: '你已预约该场次',
  BOOKING_TIME_CONFLICT: '同一时间已有预约，时间冲突',
  BOOKING_FREQUENCY_EXCEEDED: '已达预约频次上限',
  LEARNER_NOT_BOOKABLE: '账号当前不可预约，请联系机构',
  SESSION_NOT_BOOKABLE: '该场次当前不可预约',
  BOOKING_CANCEL_NOT_ALLOWED: '该场次不支持取消',
  BOOKING_CANCEL_DEADLINE_PASSED: '已超过取消截止时间',
  BOOKING_NOT_CANCELLABLE: '该预约当前不可取消',
  BOOKING_NOT_FOUND: '预约不存在',
  WAITLIST_NOT_ALLOWED: '该场次不支持候补',
  WAITLIST_SESSION_NOT_FULL: '场次未满，请直接预约',
  WAITLIST_FULL: '候补名额已满',
  WAITLIST_DUPLICATE: '你已在该场次候补',
  WAITLIST_ENTRY_NOT_FOUND: '候补不存在',
}

/** 把预约/取消错误转成学员友好中文文案（inline 展示）。 */
export function appBookingErrorText(err: unknown): string {
  if (err instanceof ApiErrorClass) {
    return APP_BOOKING_ERROR_TEXT[err.code] ?? err.message
  }
  return err instanceof Error ? err.message : '操作失败，请稍后重试'
}
