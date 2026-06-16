import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  GenerateRecurringScheduleInput,
  GenerateRecurringScheduleResult,
  PageResponse,
  RecurringSchedule,
  RecurringScheduleDetail,
  RecurringScheduleListQuery,
} from '@mini-schedule/types'
import { onboardingQueryKeys } from './onboarding'

export type RecurringScheduleId = number | string

export const recurringScheduleQueryKeys = {
  list: (query: RecurringScheduleListQuery) =>
    ['brand-recurring-schedules', query] as const,
  detail: (id: RecurringScheduleId | null) =>
    ['brand-recurring-schedule', id] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function listRecurringSchedules(
  query: RecurringScheduleListQuery = {},
  silent = false,
) {
  const search = new URLSearchParams()
  search.set('page', String(query.page ?? 1))
  search.set('page_size', String(query.page_size ?? 20))
  if (query.location_id) search.set('location_id', String(query.location_id))
  if (query.status && query.status !== 'all') search.set('status', query.status)
  return http.get<PageResponse<RecurringSchedule>>(
    `/api/v1/brand/recurring-schedules?${search.toString()}`,
    { silent },
  )
}

export function getRecurringSchedule(id: RecurringScheduleId, silent = false) {
  return http.get<RecurringScheduleDetail>(
    `/api/v1/brand/recurring-schedules/${id}`,
    { silent },
  )
}

export function generateRecurringSchedule(
  input: GenerateRecurringScheduleInput,
  silent = false,
) {
  return http.post<GenerateRecurringScheduleResult>(
    '/api/v1/brand/recurring-schedules',
    input,
    { silent },
  )
}

export function cancelRecurringSchedule(
  id: RecurringScheduleId,
  silent = false,
) {
  return http.patch<RecurringSchedule>(
    `/api/v1/brand/recurring-schedules/${id}/cancel`,
    {},
    { silent },
  )
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandRecurringSchedules(
  query: RecurringScheduleListQuery = {},
) {
  return useQuery<PageResponse<RecurringSchedule>>({
    queryKey: recurringScheduleQueryKeys.list(query),
    queryFn: () => listRecurringSchedules(query, true),
  })
}

export function useBrandRecurringSchedule(id: RecurringScheduleId | null) {
  return useQuery<RecurringScheduleDetail>({
    queryKey: recurringScheduleQueryKeys.detail(id),
    queryFn: () => getRecurringSchedule(id as RecurringScheduleId, true),
    enabled: id !== null && id !== undefined,
  })
}

function invalidateRecurring(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: ['brand-recurring-schedules'],
    refetchType: 'all',
  })
  // 生成/取消会影响单场次列表与 onboarding 计数。
  queryClient.invalidateQueries({
    queryKey: ['brand-class-sessions'],
    refetchType: 'all',
  })
  queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
}

export function useGenerateRecurringSchedule() {
  const queryClient = useQueryClient()
  return useMutation<
    GenerateRecurringScheduleResult,
    Error,
    GenerateRecurringScheduleInput
  >({
    mutationFn: (input) => generateRecurringSchedule(input, true),
    onSuccess: () => invalidateRecurring(queryClient),
  })
}

export function useCancelRecurringSchedule() {
  const queryClient = useQueryClient()
  return useMutation<RecurringSchedule, Error, RecurringScheduleId>({
    mutationFn: (id) => cancelRecurringSchedule(id, true),
    onSuccess: (_, id) => {
      invalidateRecurring(queryClient)
      queryClient.invalidateQueries({
        queryKey: recurringScheduleQueryKeys.detail(id),
      })
    },
  })
}
