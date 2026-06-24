import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  Booking,
  BookingListQuery,
  CreateBookingInput,
  EndSessionResult,
  PageResponse,
  UsableEntitlement,
} from '@mini-schedule/types'

export type BookingId = number | string

export const bookingQueryKeys = {
  list: (query: BookingListQuery) => ['brand-bookings', query] as const,
  detail: (id: BookingId | null) => ['brand-booking', id] as const,
  usable: (sessionId: number | null, learnerId: number | null) =>
    ['booking-usable-entitlements', sessionId, learnerId] as const,
}

export function listBookings(query: BookingListQuery, silent = false) {
  const search = new URLSearchParams()
  search.set('page', String(query.page ?? 1))
  search.set('page_size', String(query.page_size ?? 20))
  if (query.status && query.status !== 'all') search.set('status', query.status)
  if (query.class_session_id)
    search.set('class_session_id', String(query.class_session_id))
  if (query.location_id) search.set('location_id', String(query.location_id))
  if (query.brand_learner_profile_id)
    search.set('brand_learner_profile_id', String(query.brand_learner_profile_id))
  if (query.requires_entitlement_fix)
    search.set('requires_entitlement_fix', 'true')
  return http.get<PageResponse<Booking>>(
    `/api/v1/brand/bookings?${search.toString()}`,
    { silent },
  )
}

export function getBooking(id: BookingId, silent = false) {
  return http.get<Booking>(`/api/v1/brand/bookings/${id}`, { silent })
}

export function createBooking(input: CreateBookingInput, silent = false) {
  return http.post<Booking>('/api/v1/brand/bookings', input, { silent })
}

export function cancelBooking(id: BookingId, reason?: string, silent = false) {
  return http.post<Booking>(
    `/api/v1/brand/bookings/${id}/cancel`,
    { reason },
    { silent },
  )
}

export function listUsableEntitlements(
  sessionId: number,
  learnerId: number,
  silent = false,
) {
  const search = new URLSearchParams({
    class_session_id: String(sessionId),
    brand_learner_profile_id: String(learnerId),
  })
  return http.get<UsableEntitlement[]>(
    `/api/v1/brand/bookings/usable-entitlements?${search.toString()}`,
    { silent },
  )
}

export function useBrandBookings(query: BookingListQuery, enabled = true) {
  return useQuery<PageResponse<Booking>>({
    queryKey: bookingQueryKeys.list(query),
    queryFn: () => listBookings(query, true),
    enabled,
  })
}

export function useBrandBooking(id: BookingId | null) {
  return useQuery<Booking>({
    queryKey: bookingQueryKeys.detail(id),
    queryFn: () => getBooking(id as BookingId, true),
    enabled: id !== null && id !== undefined,
  })
}

export function useUsableEntitlements(
  sessionId: number | null,
  learnerId: number | null,
) {
  return useQuery<UsableEntitlement[]>({
    queryKey: bookingQueryKeys.usable(sessionId, learnerId),
    queryFn: () =>
      listUsableEntitlements(sessionId as number, learnerId as number, true),
    enabled: Boolean(sessionId) && Boolean(learnerId),
  })
}

// 下单/取消/签到/爽约会同时改预约列表、场次 booked_count、学员预约 Tab、学员权益
// 余额/锁定/消耗、权益流水（hold/release/consume txn），全部失效。
function invalidateBooking(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of [
    'brand-bookings',
    'brand-booking',
    'brand-class-sessions',
    'brand-class-session',
    'learner-entitlements',
    'entitlement-transactions',
  ]) {
    queryClient.invalidateQueries({ queryKey: [key], refetchType: 'all' })
  }
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation<Booking, Error, CreateBookingInput>({
    mutationFn: (input) => createBooking(input, true),
    onSuccess: () => invalidateBooking(queryClient),
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation<Booking, Error, { id: BookingId; reason?: string }>({
    mutationFn: ({ id, reason }) => cancelBooking(id, reason, true),
    onSuccess: () => invalidateBooking(queryClient),
  })
}

// ─── 签到 / 履约 / 爽约 (Batch 13e) ──────────────────────────────────────────

export function attendBooking(id: BookingId, note?: string, silent = false) {
  return http.post<Booking>(
    `/api/v1/brand/bookings/${id}/attend`,
    { note },
    { silent },
  )
}

export function confirmNoShow(id: BookingId, reason?: string, silent = false) {
  return http.post<Booking>(
    `/api/v1/brand/bookings/${id}/no-show`,
    { reason },
    { silent },
  )
}

export function endSession(sessionId: number | string, silent = false) {
  return http.post<EndSessionResult>(
    `/api/v1/brand/class-sessions/${sessionId}/end`,
    {},
    { silent },
  )
}

export function useAttendBooking() {
  const queryClient = useQueryClient()
  return useMutation<Booking, Error, { id: BookingId; note?: string }>({
    mutationFn: ({ id, note }) => attendBooking(id, note, true),
    onSuccess: () => invalidateBooking(queryClient),
  })
}

export function useConfirmNoShow() {
  const queryClient = useQueryClient()
  return useMutation<Booking, Error, { id: BookingId; reason?: string }>({
    mutationFn: ({ id, reason }) => confirmNoShow(id, reason, true),
    onSuccess: () => invalidateBooking(queryClient),
  })
}

export function useEndSession() {
  const queryClient = useQueryClient()
  return useMutation<EndSessionResult, Error, { sessionId: number | string }>({
    mutationFn: ({ sessionId }) => endSession(sessionId, true),
    onSuccess: () => invalidateBooking(queryClient),
  })
}
