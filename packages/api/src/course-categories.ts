import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CourseCategory,
  CourseCategoryStatusFilter,
  CreateCourseCategoryInput,
  UpdateCourseCategoryInput,
} from '@mini-schedule/types'
import { onboardingQueryKeys } from './onboarding'

// ─── Query keys ──────────────────────────────────────────

export type CourseCategoryId = number | string

export const courseCategoryQueryKeys = {
  list: (status: CourseCategoryStatusFilter) =>
    ['brand-course-categories', status] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export interface ListCourseCategoriesParams {
  status?: CourseCategoryStatusFilter
}

export function listCourseCategories(
  params: ListCourseCategoriesParams = {},
  silent = false,
) {
  const search = new URLSearchParams()
  if (params.status && params.status !== 'all') {
    search.set('status', params.status)
  }
  const qs = search.toString()
  return http.get<{ items: CourseCategory[] }>(
    `/api/v1/brand/course-categories${qs ? `?${qs}` : ''}`,
    { silent },
  )
}

export function createCourseCategory(
  input: CreateCourseCategoryInput,
  silent = false,
) {
  return http.post<CourseCategory>(
    '/api/v1/brand/course-categories',
    input,
    { silent },
  )
}

export function updateCourseCategory(
  id: CourseCategoryId,
  input: UpdateCourseCategoryInput,
  silent = false,
) {
  return http.patch<CourseCategory>(
    `/api/v1/brand/course-categories/${id}`,
    input,
    { silent },
  )
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandCourseCategories(
  status: CourseCategoryStatusFilter = 'all',
) {
  return useQuery<{ items: CourseCategory[] }>({
    queryKey: courseCategoryQueryKeys.list(status),
    queryFn: () => listCourseCategories({ status }, true),
  })
}

function invalidateCategories(queryClient: ReturnType<typeof useQueryClient>) {
  // refetchType:'all' so inactive list queries (other status filters) also
  // refresh after a create/edit — mirrors the staff-list invalidation note.
  queryClient.invalidateQueries({
    queryKey: ['brand-course-categories'],
    refetchType: 'all',
  })
  queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
}

export function useCreateCourseCategory() {
  const queryClient = useQueryClient()
  return useMutation<CourseCategory, Error, CreateCourseCategoryInput>({
    mutationFn: (input) => createCourseCategory(input, true),
    onSuccess: () => invalidateCategories(queryClient),
  })
}

export function useUpdateCourseCategory() {
  const queryClient = useQueryClient()
  return useMutation<
    CourseCategory,
    Error,
    { id: CourseCategoryId; data: UpdateCourseCategoryInput }
  >({
    mutationFn: ({ id, data }) => updateCourseCategory(id, data, true),
    onSuccess: () => invalidateCategories(queryClient),
  })
}
