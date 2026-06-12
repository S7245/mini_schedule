import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  BrandRole,
  CreateRoleInput,
  PermissionGroup,
  RoleStatus,
  UpdateRoleInput,
} from '@mini-schedule/types'

// ─── Query keys ──────────────────────────────────────────

export const roleQueryKeys = {
  list: () => ['brand-roles'] as const,
  detail: (code: string) => ['brand-role', code] as const,
  permissionCatalog: () => ['brand-permission-catalog'] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function listBrandRoles(silent = false) {
  return http.get<BrandRole[]>('/api/v1/brand/roles', { silent })
}

export function getBrandRole(code: string, silent = false) {
  return http.get<BrandRole>(`/api/v1/brand/roles/${code}`, { silent })
}

export function createBrandRole(input: CreateRoleInput, silent = false) {
  return http.post<BrandRole>('/api/v1/brand/roles', input, { silent })
}

export function updateBrandRole(
  code: string,
  input: UpdateRoleInput,
  silent = false,
) {
  return http.put<BrandRole>(`/api/v1/brand/roles/${code}`, input, { silent })
}

export function patchRoleStatus(
  code: string,
  status: RoleStatus,
  silent = false,
) {
  return http.patch<BrandRole>(
    `/api/v1/brand/roles/${code}/status`,
    { status },
    { silent },
  )
}

export function deleteBrandRole(code: string, silent = false) {
  return http.delete<void>(`/api/v1/brand/roles/${code}`, { silent })
}

export function listPermissions(silent = false) {
  return http.get<PermissionGroup[]>('/api/v1/brand/permissions', { silent })
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandRoles(enabled = true) {
  return useQuery<BrandRole[]>({
    queryKey: roleQueryKeys.list(),
    queryFn: () => listBrandRoles(true),
    enabled,
    // Brand roles change rarely (only when platform updates role templates), so
    // a long staleTime is fine. The list page can still refetch on demand.
    staleTime: 5 * 60 * 1000,
  })
}

export function useBrandRole(code: string | null, enabled = true) {
  return useQuery<BrandRole>({
    queryKey: roleQueryKeys.detail(code ?? ''),
    queryFn: () => getBrandRole(code as string, true),
    enabled: enabled && !!code,
  })
}

/**
 * Full permission catalog grouped by domain (source for the role editor's
 * permission tree). Brand-scoped + rarely changes, so a long staleTime is fine.
 */
export function usePermissionCatalog(enabled = true) {
  return useQuery<PermissionGroup[]>({
    queryKey: roleQueryKeys.permissionCatalog(),
    queryFn: () => listPermissions(true),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Invalidate the role list (and optionally a single role) after a mutation so
 * the table + any open detail re-fetch. Brand-scoped — safe under the Batch 6
 * cross-user cache rule (session boundary already does queryClient.clear()).
 */
function invalidateRoles(
  queryClient: ReturnType<typeof useQueryClient>,
  code?: string,
) {
  queryClient.invalidateQueries({ queryKey: roleQueryKeys.list() })
  if (code) {
    queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(code) })
  }
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation<BrandRole, Error, CreateRoleInput>({
    mutationFn: (input) => createBrandRole(input, true),
    onSuccess: () => invalidateRoles(queryClient),
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation<BrandRole, Error, { code: string; input: UpdateRoleInput }>({
    mutationFn: ({ code, input }) => updateBrandRole(code, input, true),
    onSuccess: (_, { code }) => invalidateRoles(queryClient, code),
  })
}

export function usePatchRoleStatus() {
  const queryClient = useQueryClient()
  return useMutation<BrandRole, Error, { code: string; status: RoleStatus }>({
    mutationFn: ({ code, status }) => patchRoleStatus(code, status, true),
    onSuccess: (_, { code }) => invalidateRoles(queryClient, code),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (code) => deleteBrandRole(code, true),
    onSuccess: (_, code) => invalidateRoles(queryClient, code),
  })
}
