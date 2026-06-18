import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  EntitlementStatus,
  EntitlementTransaction,
  GrantEntitlementInput,
  LearnerEntitlement,
} from '@mini-schedule/types'

export type EntitlementId = number | string
export type LearnerId = number | string

export const entitlementQueryKeys = {
  byLearner: (learnerId: LearnerId | null) =>
    ['learner-entitlements', learnerId] as const,
  transactions: (entitlementId: EntitlementId | null) =>
    ['entitlement-transactions', entitlementId] as const,
}

export function listLearnerEntitlements(learnerId: LearnerId, silent = false) {
  return http.get<LearnerEntitlement[]>(
    `/api/v1/brand/learners/${learnerId}/entitlements`,
    { silent },
  )
}

export function grantEntitlement(
  learnerId: LearnerId,
  input: GrantEntitlementInput,
  silent = false,
) {
  return http.post<LearnerEntitlement>(
    `/api/v1/brand/learners/${learnerId}/entitlements`,
    input,
    { silent },
  )
}

export function listEntitlementTransactions(
  entitlementId: EntitlementId,
  silent = false,
) {
  return http.get<EntitlementTransaction[]>(
    `/api/v1/brand/entitlements/${entitlementId}/transactions`,
    { silent },
  )
}

export function adjustEntitlement(
  entitlementId: EntitlementId,
  input: { delta: number; reason: string },
  silent = false,
) {
  return http.post<LearnerEntitlement>(
    `/api/v1/brand/entitlements/${entitlementId}/adjust`,
    input,
    { silent },
  )
}

export function setEntitlementStatus(
  entitlementId: EntitlementId,
  input: { status: EntitlementStatus; reason?: string },
  silent = false,
) {
  return http.patch<LearnerEntitlement>(
    `/api/v1/brand/entitlements/${entitlementId}/status`,
    input,
    { silent },
  )
}

export function useLearnerEntitlements(learnerId: LearnerId | null) {
  return useQuery<LearnerEntitlement[]>({
    queryKey: entitlementQueryKeys.byLearner(learnerId),
    queryFn: () => listLearnerEntitlements(learnerId as LearnerId, true),
    enabled: learnerId !== null && learnerId !== undefined,
  })
}

export function useEntitlementTransactions(
  entitlementId: EntitlementId | null,
  enabled = true,
) {
  return useQuery<EntitlementTransaction[]>({
    queryKey: entitlementQueryKeys.transactions(entitlementId),
    queryFn: () => listEntitlementTransactions(entitlementId as EntitlementId, true),
    enabled: enabled && entitlementId !== null && entitlementId !== undefined,
  })
}

function invalidateEntitlements(
  queryClient: ReturnType<typeof useQueryClient>,
  entitlementId?: EntitlementId,
) {
  queryClient.invalidateQueries({
    queryKey: ['learner-entitlements'],
    refetchType: 'all',
  })
  if (entitlementId !== undefined) {
    queryClient.invalidateQueries({
      queryKey: entitlementQueryKeys.transactions(entitlementId),
    })
  }
}

export function useGrantEntitlement() {
  const queryClient = useQueryClient()
  return useMutation<
    LearnerEntitlement,
    Error,
    { learnerId: LearnerId; data: GrantEntitlementInput }
  >({
    mutationFn: ({ learnerId, data }) => grantEntitlement(learnerId, data, true),
    onSuccess: () => invalidateEntitlements(queryClient),
  })
}

export function useAdjustEntitlement() {
  const queryClient = useQueryClient()
  return useMutation<
    LearnerEntitlement,
    Error,
    { id: EntitlementId; delta: number; reason: string }
  >({
    mutationFn: ({ id, delta, reason }) =>
      adjustEntitlement(id, { delta, reason }, true),
    onSuccess: (_d, vars) => invalidateEntitlements(queryClient, vars.id),
  })
}

export function useSetEntitlementStatus() {
  const queryClient = useQueryClient()
  return useMutation<
    LearnerEntitlement,
    Error,
    { id: EntitlementId; status: EntitlementStatus; reason?: string }
  >({
    mutationFn: ({ id, status, reason }) =>
      setEntitlementStatus(id, { status, reason }, true),
    onSuccess: (_d, vars) => invalidateEntitlements(queryClient, vars.id),
  })
}
