import { useQuery } from '@tanstack/react-query'
import { http } from './client'
import type { BrandRole } from '@mini-schedule/types'

// ─── Query keys ──────────────────────────────────────────

export const roleQueryKeys = {
  list: () => ['brand-roles'] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function listBrandRoles(silent = false) {
  return http.get<BrandRole[]>('/api/v1/brand/roles', { silent })
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
