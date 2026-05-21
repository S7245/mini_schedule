import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
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
