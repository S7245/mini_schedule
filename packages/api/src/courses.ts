import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CourseStatus,
  CourseTemplate,
  CourseTemplateListItem,
  CourseTemplateListQuery,
  CreateCourseTemplateInput,
  PageResponse,
  UpdateCourseTemplateInput,
} from '@mini-schedule/types'
import { onboardingQueryKeys } from './onboarding'

// ─── Query keys ──────────────────────────────────────────

export type CourseId = number | string

export const courseQueryKeys = {
  list: (query: CourseTemplateListQuery) =>
    ['brand-courses-v2', query] as const,
  detail: (id: CourseId | null) => ['brand-course-v2', id] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function listCourses(query: CourseTemplateListQuery = {}, silent = false) {
  const search = new URLSearchParams()
  search.set('page', String(query.page ?? 1))
  search.set('page_size', String(query.page_size ?? 20))
  if (query.status && query.status !== 'all') search.set('status', query.status)
  if (query.q) search.set('q', query.q)
  if (query.category_id) search.set('category_id', String(query.category_id))
  return http.get<PageResponse<CourseTemplateListItem>>(
    `/api/v1/brand/courses?${search.toString()}`,
    { silent },
  )
}

export function getCourse(id: CourseId, silent = false) {
  return http.get<CourseTemplate>(`/api/v1/brand/courses/${id}`, { silent })
}

export function createCourse(input: CreateCourseTemplateInput, silent = false) {
  return http.post<CourseTemplate>('/api/v1/brand/courses', input, { silent })
}

export function updateCourse(
  id: CourseId,
  input: UpdateCourseTemplateInput,
  silent = false,
) {
  return http.patch<CourseTemplate>(`/api/v1/brand/courses/${id}`, input, {
    silent,
  })
}

export function updateCourseStatus(
  id: CourseId,
  status: CourseStatus,
  silent = false,
) {
  return http.patch<CourseTemplate>(
    `/api/v1/brand/courses/${id}/status`,
    { status },
    { silent },
  )
}

export function deleteCourse(id: CourseId, silent = false) {
  return http.delete<void>(`/api/v1/brand/courses/${id}`, { silent })
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandCourses(query: CourseTemplateListQuery = {}) {
  return useQuery<PageResponse<CourseTemplateListItem>>({
    queryKey: courseQueryKeys.list(query),
    queryFn: () => listCourses(query, true),
  })
}

export function useBrandCourse(id: CourseId | null) {
  return useQuery<CourseTemplate>({
    queryKey: courseQueryKeys.detail(id),
    queryFn: () => getCourse(id as CourseId, true),
    enabled: id !== null && id !== undefined,
  })
}

function invalidateCourses(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: CourseId,
) {
  queryClient.invalidateQueries({
    queryKey: ['brand-courses-v2'],
    refetchType: 'all',
  })
  queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
  if (id !== undefined) {
    queryClient.invalidateQueries({ queryKey: courseQueryKeys.detail(id) })
  }
}

export function useCreateBrandCourse() {
  const queryClient = useQueryClient()
  return useMutation<CourseTemplate, Error, CreateCourseTemplateInput>({
    mutationFn: (input) => createCourse(input, true),
    onSuccess: () => invalidateCourses(queryClient),
  })
}

export function useUpdateBrandCourse() {
  const queryClient = useQueryClient()
  return useMutation<
    CourseTemplate,
    Error,
    { id: CourseId; data: UpdateCourseTemplateInput }
  >({
    mutationFn: ({ id, data }) => updateCourse(id, data, true),
    onSuccess: (_, { id }) => invalidateCourses(queryClient, id),
  })
}

export function useUpdateBrandCourseStatus() {
  const queryClient = useQueryClient()
  return useMutation<CourseTemplate, Error, { id: CourseId; status: CourseStatus }>(
    {
      mutationFn: ({ id, status }) => updateCourseStatus(id, status, true),
      onSuccess: (_, { id }) => invalidateCourses(queryClient, id),
    },
  )
}

export function useDeleteBrandCourse() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, CourseId>({
    mutationFn: (id) => deleteCourse(id, true),
    onSuccess: () => invalidateCourses(queryClient),
  })
}
