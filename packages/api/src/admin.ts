import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type { Brand, AdminUser, PageResponse, CreateBrandInput, CreateAdminInput } from '@mini-schedule/types'

// ─── Brands ──────────────────────────────────────────────

export function useBrands(page = 1, pageSize = 20) {
  return useQuery<PageResponse<Brand>>({
    queryKey: ['brands', page, pageSize],
    queryFn: () =>
      http.get<PageResponse<Brand>>(`/api/v1/admin/brands?page=${page}&page_size=${pageSize}`),
  })
}

export function useBrand(id: string | null) {
  return useQuery<Brand>({
    queryKey: ['brand', id],
    queryFn: () => http.get<Brand>(`/api/v1/admin/brands/${id}`),
    enabled: !!id,
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation<Brand, Error, CreateBrandInput>({
    mutationFn: (data) => http.post<Brand>('/api/v1/admin/brands', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()
  return useMutation<Brand, Error, { id: string; data: { name?: string; logo_url?: string; contact_name?: string } }>({
    mutationFn: ({ id, data }) => http.put<Brand>(`/api/v1/admin/brands/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      queryClient.invalidateQueries({ queryKey: ['brand', id] })
    },
  })
}

export function useUpdateBrandStatus() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; status: string }>({
    mutationFn: ({ id, status }) => http.patch<void>(`/api/v1/admin/brands/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

// ─── Admins ──────────────────────────────────────────────

export function useAdmins(page = 1, pageSize = 20) {
  return useQuery<PageResponse<AdminUser>>({
    queryKey: ['admins', page, pageSize],
    queryFn: () =>
      http.get<PageResponse<AdminUser>>(`/api/v1/admin/admins?page=${page}&page_size=${pageSize}`),
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  return useMutation<AdminUser, Error, CreateAdminInput>({
    mutationFn: (data) => http.post<AdminUser>('/api/v1/admin/admins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })
}

export function useAdminLogout() {
  const queryClient = useQueryClient()

  return useMutation<void, Error>({
    mutationFn: () => http.post<void>('/api/v1/admin/logout'),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
