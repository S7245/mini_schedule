import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CreateStaffInput,
  PageResponse,
  ReplaceLocationAssignmentsInput,
  ReplaceRoleAssignmentsInput,
  Staff,
  StaffListItem,
  StaffListQuery,
  StaffStatus,
  UpdateStaffInput,
} from '@mini-schedule/types'
import { onboardingQueryKeys } from './onboarding'

// ─── Query keys ──────────────────────────────────────────

export type StaffId = number | string

export const staffQueryKeys = {
  list: (query: StaffListQuery) => ['brand-staff-list', query] as const,
  detail: (id: StaffId | null) => ['brand-staff', id] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function listStaff(query: StaffListQuery = {}, silent = false) {
  const search = new URLSearchParams()
  search.set('page', String(query.page ?? 1))
  search.set('page_size', String(query.page_size ?? 20))
  if (query.status && query.status !== 'all') search.set('status', query.status)
  if (query.with_instructor !== undefined)
    search.set('with_instructor', String(query.with_instructor))
  if (query.q) search.set('q', query.q)
  return http.get<PageResponse<StaffListItem>>(
    `/api/v1/brand/staff?${search.toString()}`,
    { silent },
  )
}

export function getStaff(id: StaffId, silent = false) {
  return http.get<Staff>(`/api/v1/brand/staff/${id}`, { silent })
}

export function createStaff(input: CreateStaffInput, silent = false) {
  return http.post<Staff>('/api/v1/brand/staff', input, { silent })
}

export function updateStaff(id: StaffId, input: UpdateStaffInput, silent = false) {
  return http.patch<Staff>(`/api/v1/brand/staff/${id}`, input, { silent })
}

export function updateStaffStatus(
  id: StaffId,
  status: StaffStatus,
  silent = false,
) {
  return http.patch<Staff>(
    `/api/v1/brand/staff/${id}/status`,
    { status },
    { silent },
  )
}

export function deleteStaff(id: StaffId, silent = false) {
  return http.delete<void>(`/api/v1/brand/staff/${id}`, { silent })
}

export function replaceStaffRoleAssignments(
  id: StaffId,
  input: ReplaceRoleAssignmentsInput,
  silent = false,
) {
  return http.put<Staff>(
    `/api/v1/brand/staff/${id}/role-assignments`,
    input,
    { silent },
  )
}

export function replaceStaffLocationAssignments(
  id: StaffId,
  input: ReplaceLocationAssignmentsInput,
  silent = false,
) {
  return http.put<Staff>(
    `/api/v1/brand/staff/${id}/location-assignments`,
    input,
    { silent },
  )
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandStaffList(query: StaffListQuery = {}) {
  return useQuery<PageResponse<StaffListItem>>({
    queryKey: staffQueryKeys.list(query),
    queryFn: () => listStaff(query, true),
  })
}

export function useBrandStaff(id: StaffId | null) {
  return useQuery<Staff>({
    queryKey: staffQueryKeys.detail(id),
    queryFn: () => getStaff(id as StaffId, true),
    enabled: id !== null && id !== undefined,
  })
}

function invalidateStaff(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: StaffId,
) {
  queryClient.invalidateQueries({ queryKey: ['brand-staff-list'] })
  queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
  if (id !== undefined) {
    queryClient.invalidateQueries({ queryKey: staffQueryKeys.detail(id) })
  }
}

export function useCreateBrandStaff() {
  const queryClient = useQueryClient()
  return useMutation<Staff, Error, CreateStaffInput>({
    mutationFn: (input) => createStaff(input, true),
    onSuccess: () => invalidateStaff(queryClient),
  })
}

export function useUpdateBrandStaff() {
  const queryClient = useQueryClient()
  return useMutation<Staff, Error, { id: StaffId; data: UpdateStaffInput }>({
    mutationFn: ({ id, data }) => updateStaff(id, data, true),
    onSuccess: (_, { id }) => invalidateStaff(queryClient, id),
  })
}

export function useUpdateBrandStaffStatus() {
  const queryClient = useQueryClient()
  return useMutation<Staff, Error, { id: StaffId; status: StaffStatus }>({
    mutationFn: ({ id, status }) => updateStaffStatus(id, status, true),
    onSuccess: (_, { id }) => invalidateStaff(queryClient, id),
  })
}

export function useDeleteBrandStaff() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, StaffId>({
    mutationFn: (id) => deleteStaff(id, true),
    onSuccess: () => invalidateStaff(queryClient),
  })
}

export function useReplaceStaffRoleAssignments() {
  const queryClient = useQueryClient()
  return useMutation<
    Staff,
    Error,
    { id: StaffId; data: ReplaceRoleAssignmentsInput }
  >({
    mutationFn: ({ id, data }) => replaceStaffRoleAssignments(id, data, true),
    onSuccess: (_, { id }) => invalidateStaff(queryClient, id),
  })
}

export function useReplaceStaffLocationAssignments() {
  const queryClient = useQueryClient()
  return useMutation<
    Staff,
    Error,
    { id: StaffId; data: ReplaceLocationAssignmentsInput }
  >({
    mutationFn: ({ id, data }) => replaceStaffLocationAssignments(id, data, true),
    onSuccess: (_, { id }) => invalidateStaff(queryClient, id),
  })
}
