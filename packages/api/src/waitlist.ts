import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  JoinWaitlistInput,
  PromoteWaitlistInput,
  WaitlistEntry,
} from '@mini-schedule/types'

export type WaitlistId = number | string

export const waitlistQueryKeys = {
  bySession: (sessionId: number | null) => ['brand-waitlist', sessionId] as const,
}

export function listWaitlist(sessionId: number, silent = false) {
  return http.get<WaitlistEntry[]>(
    `/api/v1/brand/bookings/waitlist?class_session_id=${sessionId}`,
    { silent },
  )
}

export function joinWaitlist(input: JoinWaitlistInput, silent = false) {
  return http.post<WaitlistEntry>('/api/v1/brand/bookings/waitlist', input, {
    silent,
  })
}

export function promoteWaitlist(
  id: WaitlistId,
  input: PromoteWaitlistInput,
  silent = false,
) {
  return http.post<WaitlistEntry>(
    `/api/v1/brand/bookings/waitlist/${id}/promote`,
    input,
    { silent },
  )
}

export function skipWaitlist(id: WaitlistId, reason: string, silent = false) {
  return http.post<WaitlistEntry>(
    `/api/v1/brand/bookings/waitlist/${id}/skip`,
    { reason },
    { silent },
  )
}

export function cancelWaitlist(id: WaitlistId, silent = false) {
  return http.post<WaitlistEntry>(
    `/api/v1/brand/bookings/waitlist/${id}/cancel`,
    {},
    { silent },
  )
}

export function useSessionWaitlist(sessionId: number | null, enabled = true) {
  return useQuery<WaitlistEntry[]>({
    queryKey: waitlistQueryKeys.bySession(sessionId),
    queryFn: () => listWaitlist(sessionId as number, true),
    enabled: enabled && sessionId !== null && sessionId !== undefined,
  })
}

// join/skip/cancel 改变活跃候补数 → 同时失效场次列表（携带 waitlist_count，驱动场次行「候补 (N)」徽标）。
function invalidateWaitlist(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of ['brand-waitlist', 'brand-class-sessions', 'brand-class-session']) {
    queryClient.invalidateQueries({ queryKey: [key], refetchType: 'all' })
  }
}

// 转正会建 booking + 扣权益 + 改场次 booked_count → 一并失效（同 13c 三连）。
function invalidatePromotion(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of [
    'brand-waitlist',
    'brand-bookings',
    'brand-class-sessions',
    'brand-class-session',
    'learner-entitlements',
  ]) {
    queryClient.invalidateQueries({ queryKey: [key], refetchType: 'all' })
  }
}

export function useJoinWaitlist() {
  const queryClient = useQueryClient()
  return useMutation<WaitlistEntry, Error, JoinWaitlistInput>({
    mutationFn: (input) => joinWaitlist(input, true),
    onSuccess: () => invalidateWaitlist(queryClient),
  })
}

export function usePromoteWaitlist() {
  const queryClient = useQueryClient()
  return useMutation<
    WaitlistEntry,
    Error,
    { id: WaitlistId; input: PromoteWaitlistInput }
  >({
    mutationFn: ({ id, input }) => promoteWaitlist(id, input, true),
    onSuccess: () => invalidatePromotion(queryClient),
  })
}

export function useSkipWaitlist() {
  const queryClient = useQueryClient()
  return useMutation<WaitlistEntry, Error, { id: WaitlistId; reason: string }>({
    mutationFn: ({ id, reason }) => skipWaitlist(id, reason, true),
    onSuccess: () => invalidateWaitlist(queryClient),
  })
}

export function useCancelWaitlist() {
  const queryClient = useQueryClient()
  return useMutation<WaitlistEntry, Error, { id: WaitlistId }>({
    mutationFn: ({ id }) => cancelWaitlist(id, true),
    onSuccess: () => invalidateWaitlist(queryClient),
  })
}
