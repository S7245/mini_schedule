import { useQuery } from '@tanstack/react-query'
import { http } from './client'

/**
 * Data scope kinds returned by GET /me/permissions.
 *
 * - `all_brand` — actor sees all data in the brand (owner / brand-scope roles)
 * - `assigned_locations` — actor is limited to the listed location_ids
 *
 * Backend may also return `none` for users with no active role assignment; we
 * keep that as an explicit narrow case so callers must handle it.
 */
export type MeDataScopeKind = 'all_brand' | 'assigned_locations' | 'none'

export interface MeDataScope {
  kind: MeDataScopeKind
  location_ids?: number[]
}

export interface MyPermissionsResponse {
  permissions: string[]
  data_scope: MeDataScope
}

// ─── Query keys ──────────────────────────────────────────

export const meQueryKeys = {
  permissions: () => ['brand-me-permissions'] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function fetchMyPermissions(silent = false) {
  return http.get<MyPermissionsResponse>('/api/v1/brand/me/permissions', {
    silent,
  })
}

// ─── React Query hooks ───────────────────────────────────

export interface UseMyPermissionsOptions {
  enabled?: boolean
}

/**
 * Fetch the current brand user's effective permissions + data_scope.
 *
 * - 60s staleTime (matches backend Redis TTL — within 60s the same response is
 *   reused without a re-fetch, so menu/button state is stable)
 * - refetchOnWindowFocus so a user returning to the tab after an admin change
 *   sees their new permission set within 60s.
 * - retry: 1 to avoid burning permission checks during transient outages.
 *
 * Errors are surfaced silently — the caller (`usePermissions`) treats any
 * non-success as fail-closed (all `has()` return false).
 */
export function useMyPermissions(options: UseMyPermissionsOptions = {}) {
  const { enabled = true } = options
  return useQuery<MyPermissionsResponse>({
    queryKey: meQueryKeys.permissions(),
    queryFn: () => fetchMyPermissions(true),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
