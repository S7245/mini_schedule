import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type { BrandProfile, UpdateBrandProfileInput } from '@mini-schedule/types'
import { onboardingQueryKeys } from './onboarding'

// ─── Query keys ──────────────────────────────────────────

export const brandProfileQueryKeys = {
  detail: () => ['brand-profile'] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function getBrandProfile(silent = false) {
  return http.get<BrandProfile>('/api/v1/brand/profile', { silent })
}

export function updateBrandProfile(
  input: UpdateBrandProfileInput,
  silent = false,
) {
  return http.patch<BrandProfile>('/api/v1/brand/profile', input, { silent })
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandProfile(enabled = true) {
  return useQuery<BrandProfile>({
    queryKey: brandProfileQueryKeys.detail(),
    queryFn: () => getBrandProfile(true),
    enabled,
  })
}

export function useUpdateBrandProfile() {
  const queryClient = useQueryClient()

  return useMutation<BrandProfile, Error, UpdateBrandProfileInput>({
    mutationFn: (input) => updateBrandProfile(input, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandProfileQueryKeys.detail() })
      queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
    },
  })
}
