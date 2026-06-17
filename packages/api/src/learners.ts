import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CreateLearnerInput,
  Learner,
  LearnerListQuery,
  LearnerStatus,
  PageResponse,
  UpdateLearnerInput,
} from '@mini-schedule/types'

// ─── Query keys ──────────────────────────────────────────

export type LearnerId = number | string

export const learnerQueryKeys = {
  list: (query: LearnerListQuery) => ['brand-learners', query] as const,
  detail: (id: LearnerId | null) => ['brand-learner', id] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function listLearners(query: LearnerListQuery, silent = false) {
  const search = new URLSearchParams()
  search.set('page', String(query.page ?? 1))
  search.set('page_size', String(query.page_size ?? 20))
  if (query.q) search.set('q', query.q)
  if (query.status && query.status !== 'all') search.set('status', query.status)
  if (query.primary_location_id)
    search.set('primary_location_id', String(query.primary_location_id))
  return http.get<PageResponse<Learner>>(
    `/api/v1/brand/learners?${search.toString()}`,
    { silent },
  )
}

export function getLearner(id: LearnerId, silent = false) {
  return http.get<Learner>(`/api/v1/brand/learners/${id}`, { silent })
}

export function createLearner(input: CreateLearnerInput, silent = false) {
  return http.post<Learner>('/api/v1/brand/learners', input, { silent })
}

export function updateLearner(
  id: LearnerId,
  input: UpdateLearnerInput,
  silent = false,
) {
  return http.patch<Learner>(`/api/v1/brand/learners/${id}`, input, { silent })
}

export function updateLearnerStatus(
  id: LearnerId,
  status: LearnerStatus,
  silent = false,
) {
  return http.patch<Learner>(
    `/api/v1/brand/learners/${id}/status`,
    { status },
    { silent },
  )
}

export function deleteLearner(id: LearnerId, silent = false) {
  return http.delete<null>(`/api/v1/brand/learners/${id}`, { silent })
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandLearners(query: LearnerListQuery, enabled = true) {
  return useQuery<PageResponse<Learner>>({
    queryKey: learnerQueryKeys.list(query),
    queryFn: () => listLearners(query, true),
    enabled,
  })
}

export function useBrandLearner(id: LearnerId | null) {
  return useQuery<Learner>({
    queryKey: learnerQueryKeys.detail(id),
    queryFn: () => getLearner(id as LearnerId, true),
    enabled: id !== null && id !== undefined,
  })
}

function invalidateLearners(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: ['brand-learners'],
    refetchType: 'all',
  })
  queryClient.invalidateQueries({ queryKey: ['brand-learner'] })
}

export function useCreateLearner() {
  const queryClient = useQueryClient()
  return useMutation<Learner, Error, CreateLearnerInput>({
    mutationFn: (input) => createLearner(input, true),
    onSuccess: () => invalidateLearners(queryClient),
  })
}

export function useUpdateLearner() {
  const queryClient = useQueryClient()
  return useMutation<Learner, Error, { id: LearnerId; data: UpdateLearnerInput }>({
    mutationFn: ({ id, data }) => updateLearner(id, data, true),
    onSuccess: () => invalidateLearners(queryClient),
  })
}

export function useUpdateLearnerStatus() {
  const queryClient = useQueryClient()
  return useMutation<Learner, Error, { id: LearnerId; status: LearnerStatus }>({
    mutationFn: ({ id, status }) => updateLearnerStatus(id, status, true),
    onSuccess: () => invalidateLearners(queryClient),
  })
}

export function useDeleteLearner() {
  const queryClient = useQueryClient()
  return useMutation<null, Error, LearnerId>({
    mutationFn: (id) => deleteLearner(id, true),
    onSuccess: () => invalidateLearners(queryClient),
  })
}
