import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CancelClassSessionInput,
  ClassSession,
  ClassSessionListItem,
  ClassSessionListQuery,
  CreateClassSessionInput,
  PageResponse,
} from '@mini-schedule/types'
import { onboardingQueryKeys } from './onboarding'

// ─── Query keys ──────────────────────────────────────────

export type ClassSessionId = number | string

export const classSessionQueryKeys = {
  list: (query: ClassSessionListQuery) =>
    ['brand-class-sessions', query] as const,
  detail: (id: ClassSessionId | null) => ['brand-class-session', id] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function listClassSessions(
  query: ClassSessionListQuery = {},
  silent = false,
) {
  const search = new URLSearchParams()
  search.set('page', String(query.page ?? 1))
  search.set('page_size', String(query.page_size ?? 20))
  if (query.location_id) search.set('location_id', String(query.location_id))
  if (query.course_id) search.set('course_id', String(query.course_id))
  if (query.instructor_profile_id)
    search.set('instructor_profile_id', String(query.instructor_profile_id))
  if (query.status && query.status !== 'all') search.set('status', query.status)
  if (query.from) search.set('from', query.from)
  if (query.to) search.set('to', query.to)
  return http.get<PageResponse<ClassSessionListItem>>(
    `/api/v1/brand/class-sessions?${search.toString()}`,
    { silent },
  )
}

export function getClassSession(id: ClassSessionId, silent = false) {
  return http.get<ClassSession>(`/api/v1/brand/class-sessions/${id}`, {
    silent,
  })
}

export function createClassSession(
  input: CreateClassSessionInput,
  silent = false,
) {
  return http.post<ClassSession>('/api/v1/brand/class-sessions', input, {
    silent,
  })
}

export function cancelClassSession(
  id: ClassSessionId,
  input: CancelClassSessionInput = {},
  silent = false,
) {
  return http.patch<ClassSession>(
    `/api/v1/brand/class-sessions/${id}/cancel`,
    input,
    { silent },
  )
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandClassSessions(query: ClassSessionListQuery = {}) {
  return useQuery<PageResponse<ClassSessionListItem>>({
    queryKey: classSessionQueryKeys.list(query),
    queryFn: () => listClassSessions(query, true),
  })
}

export function useBrandClassSession(id: ClassSessionId | null) {
  return useQuery<ClassSession>({
    queryKey: classSessionQueryKeys.detail(id),
    queryFn: () => getClassSession(id as ClassSessionId, true),
    enabled: id !== null && id !== undefined,
  })
}

function invalidateSessions(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: ClassSessionId,
) {
  queryClient.invalidateQueries({
    queryKey: ['brand-class-sessions'],
    refetchType: 'all',
  })
  queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
  if (id !== undefined) {
    queryClient.invalidateQueries({
      queryKey: classSessionQueryKeys.detail(id),
    })
  }
}

export function useCreateClassSession() {
  const queryClient = useQueryClient()
  return useMutation<ClassSession, Error, CreateClassSessionInput>({
    mutationFn: (input) => createClassSession(input, true),
    onSuccess: () => invalidateSessions(queryClient),
  })
}

export function useCancelClassSession() {
  const queryClient = useQueryClient()
  return useMutation<
    ClassSession,
    Error,
    { id: ClassSessionId; data?: CancelClassSessionInput }
  >({
    mutationFn: ({ id, data }) => cancelClassSession(id, data ?? {}, true),
    onSuccess: (_, { id }) => invalidateSessions(queryClient, id),
  })
}
