import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CompleteOnboardingResult,
  OnboardingStatus,
  OnboardingStepKey,
  SkipOnboardingStepInput,
  SkipOnboardingStepResult,
} from '@mini-schedule/types'

// ─── Query keys ──────────────────────────────────────────

export const onboardingQueryKeys = {
  status: () => ['brand-onboarding-status'] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function getOnboardingStatus(silent = false) {
  return http.get<OnboardingStatus>('/api/v1/brand/onboarding/status', { silent })
}

export function skipOnboardingStep(
  stepKey: OnboardingStepKey,
  body: SkipOnboardingStepInput = {},
  silent = false,
) {
  return http.patch<SkipOnboardingStepResult>(
    `/api/v1/brand/onboarding/steps/${stepKey}/skip`,
    body,
    { silent },
  )
}

export function completeOnboarding(silent = false) {
  return http.post<CompleteOnboardingResult>(
    '/api/v1/brand/onboarding/complete',
    undefined,
    { silent },
  )
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandOnboardingStatus(enabled = true) {
  return useQuery<OnboardingStatus>({
    queryKey: onboardingQueryKeys.status(),
    queryFn: () => getOnboardingStatus(true),
    enabled,
    // Always re-read from server to keep multi-step UI in sync with backend counts
    staleTime: 0,
  })
}

export function useSkipOnboardingStep() {
  const queryClient = useQueryClient()

  return useMutation<
    SkipOnboardingStepResult,
    Error,
    { stepKey: OnboardingStepKey; reason?: string }
  >({
    mutationFn: ({ stepKey, reason }) =>
      skipOnboardingStep(stepKey, reason ? { reason } : {}, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
    },
  })
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()

  return useMutation<CompleteOnboardingResult, Error, void>({
    mutationFn: () => completeOnboarding(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
      queryClient.invalidateQueries({ queryKey: ['brand-profile'] })
    },
  })
}
