import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CreateLearnerTagInput,
  LearnerTag,
  LearnerTagStatusFilter,
  UpdateLearnerTagInput,
} from '@mini-schedule/types'

// ─── Query keys ──────────────────────────────────────────

export type LearnerTagId = number | string

export const learnerTagQueryKeys = {
  list: (status: LearnerTagStatusFilter) => ['brand-learner-tags', status] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function listLearnerTags(
  status: LearnerTagStatusFilter = 'all',
  silent = false,
) {
  const search = new URLSearchParams()
  if (status && status !== 'all') search.set('status', status)
  const qs = search.toString()
  return http.get<LearnerTag[]>(
    `/api/v1/brand/learner-tags${qs ? `?${qs}` : ''}`,
    { silent },
  )
}

export function createLearnerTag(input: CreateLearnerTagInput, silent = false) {
  return http.post<LearnerTag>('/api/v1/brand/learner-tags', input, { silent })
}

export function updateLearnerTag(
  id: LearnerTagId,
  input: UpdateLearnerTagInput,
  silent = false,
) {
  return http.patch<LearnerTag>(`/api/v1/brand/learner-tags/${id}`, input, {
    silent,
  })
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandLearnerTags(
  status: LearnerTagStatusFilter = 'all',
  enabled = true,
) {
  return useQuery<LearnerTag[]>({
    queryKey: learnerTagQueryKeys.list(status),
    queryFn: () => listLearnerTags(status, true),
    enabled,
  })
}

function invalidateTags(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: ['brand-learner-tags'],
    refetchType: 'all',
  })
  // 学员列表/详情内嵌的是标签快照（name/color），改名/改色后需刷新它们。
  queryClient.invalidateQueries({ queryKey: ['brand-learners'], refetchType: 'all' })
  queryClient.invalidateQueries({ queryKey: ['brand-learner'] })
}

export function useCreateLearnerTag() {
  const queryClient = useQueryClient()
  return useMutation<LearnerTag, Error, CreateLearnerTagInput>({
    mutationFn: (input) => createLearnerTag(input, true),
    onSuccess: () => invalidateTags(queryClient),
  })
}

export function useUpdateLearnerTag() {
  const queryClient = useQueryClient()
  return useMutation<
    LearnerTag,
    Error,
    { id: LearnerTagId; data: UpdateLearnerTagInput }
  >({
    mutationFn: ({ id, data }) => updateLearnerTag(id, data, true),
    onSuccess: () => invalidateTags(queryClient),
  })
}
