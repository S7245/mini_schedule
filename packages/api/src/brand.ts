import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  BrandUser,
  AppUser,
  Course,
  TrainingRecord,
  PageResponse,
  CreateAppUserInput,
  CreateCourseInput,
  UpdateCourseInput,
  CreateTrainingInput,
} from '@mini-schedule/types'

// ─── Brand Users (managed by brand admin) ────────────────

export function useBrandUsers(page = 1, pageSize = 20) {
  return useQuery<PageResponse<AppUser>>({
    queryKey: ['brand-users', page, pageSize],
    queryFn: () =>
      http.get<PageResponse<AppUser>>(
        `/api/v1/brand/users?page=${page}&page_size=${pageSize}`
      ),
  })
}

export function useBrandUser(id: string | null) {
  return useQuery<AppUser>({
    queryKey: ['brand-user', id],
    queryFn: () => http.get<AppUser>(`/api/v1/brand/users/${id}`),
    enabled: !!id,
  })
}

export function useCreateBrandUser() {
  const queryClient = useQueryClient()

  return useMutation<AppUser, Error, CreateAppUserInput>({
    mutationFn: (data) =>
      http.post<AppUser>('/api/v1/brand/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-users'] })
    },
  })
}

// ─── Brand Courses ───────────────────────────────────────

export function useBrandCourses(page = 1, pageSize = 20) {
  return useQuery<PageResponse<Course>>({
    queryKey: ['brand-courses', page, pageSize],
    queryFn: () =>
      http.get<PageResponse<Course>>(
        `/api/v1/brand/courses?page=${page}&page_size=${pageSize}`
      ),
  })
}

export function useBrandCourse(id: string | null) {
  return useQuery<Course>({
    queryKey: ['brand-course', id],
    queryFn: () => http.get<Course>(`/api/v1/brand/courses/${id}`),
    enabled: !!id,
  })
}

export function useCreateBrandCourse() {
  const queryClient = useQueryClient()

  return useMutation<Course, Error, CreateCourseInput>({
    mutationFn: (data) =>
      http.post<Course>('/api/v1/brand/courses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-courses'] })
    },
  })
}

export function useUpdateBrandCourse() {
  const queryClient = useQueryClient()

  return useMutation<Course, Error, { id: string; data: UpdateCourseInput }>({
    mutationFn: ({ id, data }) =>
      http.put<Course>(`/api/v1/brand/courses/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['brand-courses'] })
      queryClient.invalidateQueries({ queryKey: ['brand-course', id] })
    },
  })
}

export function useUpdateCourseStatus() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; status: string }>({
    mutationFn: ({ id, status }) =>
      http.patch<void>(`/api/v1/brand/courses/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-courses'] })
    },
  })
}

export function useDeleteBrandCourse() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      http.delete<void>(`/api/v1/brand/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-courses'] })
    },
  })
}

// ─── Brand Trainings ─────────────────────────────────────

export function useBrandTrainings(page = 1, pageSize = 20) {
  return useQuery<PageResponse<TrainingRecord>>({
    queryKey: ['brand-trainings', page, pageSize],
    queryFn: () =>
      http.get<PageResponse<TrainingRecord>>(
        `/api/v1/brand/trainings?page=${page}&page_size=${pageSize}`
      ),
  })
}
