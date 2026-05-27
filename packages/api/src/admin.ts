import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  AdminUser,
  Brand,
  BrandSubscription,
  BrandSubscriptionStatus,
  CreateAdminInput,
  CreateBrandInput,
  CreateSaaSPlanInput,
  OperationLog,
  PageResponse,
  PaymentCallbackLog,
  PaymentTransaction,
  PlatformSummary,
  SaaSPlan,
  SaaSPlanOrder,
  SaaSPlanStatus,
} from '@mini-schedule/types'

function toQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  const value = search.toString()
  return value ? `?${value}` : ''
}

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

// ─── Platform Commercialization ─────────────────────────

export function usePlatformSummary() {
  return useQuery<PlatformSummary>({
    queryKey: ['platform-summary'],
    queryFn: () => http.get<PlatformSummary>('/api/v1/admin/platform/summary'),
  })
}

export function useSaaSPlans(page = 1, pageSize = 20, includeInactive = true) {
  return useQuery<PageResponse<SaaSPlan>>({
    queryKey: ['saas-plans', page, pageSize, includeInactive],
    queryFn: () =>
      http.get<PageResponse<SaaSPlan>>(
        `/api/v1/admin/saas-plans${toQuery({ page, page_size: pageSize, include_inactive: includeInactive })}`,
      ),
  })
}

export function useCreateSaaSPlan() {
  const queryClient = useQueryClient()
  return useMutation<SaaSPlan, Error, CreateSaaSPlanInput>({
    mutationFn: (data) => http.post<SaaSPlan>('/api/v1/admin/saas-plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-plans'] })
    },
  })
}

export function useUpdateSaaSPlanStatus() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; status: SaaSPlanStatus }>({
    mutationFn: ({ id, status }) => http.patch<void>(`/api/v1/admin/saas-plans/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-plans'] })
    },
  })
}

export function useSaaSPlanOrders(page = 1, pageSize = 20, filters: { status?: string; brand_id?: string } = {}) {
  return useQuery<PageResponse<SaaSPlanOrder>>({
    queryKey: ['saas-plan-orders', page, pageSize, filters],
    queryFn: () =>
      http.get<PageResponse<SaaSPlanOrder>>(
        `/api/v1/admin/saas-plan-orders${toQuery({ page, page_size: pageSize, ...filters })}`,
      ),
  })
}

export function useBrandSubscriptions(page = 1, pageSize = 20, filters: { status?: string; brand_id?: string } = {}) {
  return useQuery<PageResponse<BrandSubscription>>({
    queryKey: ['brand-subscriptions', page, pageSize, filters],
    queryFn: () =>
      http.get<PageResponse<BrandSubscription>>(
        `/api/v1/admin/brand-subscriptions${toQuery({ page, page_size: pageSize, ...filters })}`,
      ),
  })
}

export function useManualRenewBrandSubscription() {
  const queryClient = useQueryClient()
  return useMutation<BrandSubscription, Error, { id: string; extend_months: number; extend_days: number; reason: string }>({
    mutationFn: ({ id, ...data }) => http.post<BrandSubscription>(`/api/v1/admin/brand-subscriptions/${id}/renew`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['operation-logs'] })
      queryClient.invalidateQueries({ queryKey: ['platform-summary'] })
    },
  })
}

export function useUpdateBrandSubscriptionLimits() {
  const queryClient = useQueryClient()
  return useMutation<
    BrandSubscription,
    Error,
    {
      id: string
      max_locations?: number
      max_staff_seats?: number
      max_learners?: number
      reason: string
    }
  >({
    mutationFn: ({ id, ...data }) => http.patch<BrandSubscription>(`/api/v1/admin/brand-subscriptions/${id}/limits`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['operation-logs'] })
    },
  })
}

export function useUpdateBrandSubscriptionStatus() {
  const queryClient = useQueryClient()
  return useMutation<BrandSubscription, Error, { id: string; status: BrandSubscriptionStatus; frozen_reason?: string; reason: string }>({
    mutationFn: ({ id, ...data }) => http.patch<BrandSubscription>(`/api/v1/admin/brand-subscriptions/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['operation-logs'] })
      queryClient.invalidateQueries({ queryKey: ['platform-summary'] })
    },
  })
}

export function usePaymentTransactions(page = 1, pageSize = 20, filters: { status?: string; brand_id?: string; order_id?: string } = {}) {
  return useQuery<PageResponse<PaymentTransaction>>({
    queryKey: ['payment-transactions', page, pageSize, filters],
    queryFn: () =>
      http.get<PageResponse<PaymentTransaction>>(
        `/api/v1/admin/payment-transactions${toQuery({ page, page_size: pageSize, ...filters })}`,
      ),
  })
}

export function usePaymentCallbackLogs(page = 1, pageSize = 20, filters: { status?: string } = {}) {
  return useQuery<PageResponse<PaymentCallbackLog>>({
    queryKey: ['payment-callback-logs', page, pageSize, filters],
    queryFn: () =>
      http.get<PageResponse<PaymentCallbackLog>>(
        `/api/v1/admin/payment-callback-logs${toQuery({ page, page_size: pageSize, ...filters })}`,
      ),
  })
}

export function useOperationLogs(page = 1, pageSize = 20, filters: { brand_id?: string; target_type?: string; target_id?: string } = {}) {
  return useQuery<PageResponse<OperationLog>>({
    queryKey: ['operation-logs', page, pageSize, filters],
    queryFn: () =>
      http.get<PageResponse<OperationLog>>(
        `/api/v1/admin/operation-logs${toQuery({ page, page_size: pageSize, ...filters })}`,
      ),
  })
}
