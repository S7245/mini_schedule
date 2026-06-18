import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CreateEntitlementProductInput,
  EntitlementProduct,
  EntitlementProductListQuery,
  EntitlementProductStatus,
  PageResponse,
  UpdateEntitlementProductInput,
} from '@mini-schedule/types'

export type EntitlementProductId = number | string

export const entitlementProductQueryKeys = {
  list: (query: EntitlementProductListQuery) =>
    ['brand-entitlement-products', query] as const,
  detail: (id: EntitlementProductId | null) =>
    ['brand-entitlement-product', id] as const,
}

export function listEntitlementProducts(
  query: EntitlementProductListQuery,
  silent = false,
) {
  const search = new URLSearchParams()
  search.set('page', String(query.page ?? 1))
  search.set('page_size', String(query.page_size ?? 20))
  if (query.status && query.status !== 'all') search.set('status', query.status)
  if (query.product_type && query.product_type !== 'all')
    search.set('product_type', query.product_type)
  return http.get<PageResponse<EntitlementProduct>>(
    `/api/v1/brand/entitlement-products?${search.toString()}`,
    { silent },
  )
}

export function getEntitlementProduct(id: EntitlementProductId, silent = false) {
  return http.get<EntitlementProduct>(
    `/api/v1/brand/entitlement-products/${id}`,
    { silent },
  )
}

export function createEntitlementProduct(
  input: CreateEntitlementProductInput,
  silent = false,
) {
  return http.post<EntitlementProduct>(
    '/api/v1/brand/entitlement-products',
    input,
    { silent },
  )
}

export function updateEntitlementProduct(
  id: EntitlementProductId,
  input: UpdateEntitlementProductInput,
  silent = false,
) {
  return http.patch<EntitlementProduct>(
    `/api/v1/brand/entitlement-products/${id}`,
    input,
    { silent },
  )
}

export function updateEntitlementProductStatus(
  id: EntitlementProductId,
  status: EntitlementProductStatus,
  silent = false,
) {
  return http.patch<EntitlementProduct>(
    `/api/v1/brand/entitlement-products/${id}/status`,
    { status },
    { silent },
  )
}

export function useBrandEntitlementProducts(
  query: EntitlementProductListQuery,
  enabled = true,
) {
  return useQuery<PageResponse<EntitlementProduct>>({
    queryKey: entitlementProductQueryKeys.list(query),
    queryFn: () => listEntitlementProducts(query, true),
    enabled,
  })
}

export function useBrandEntitlementProduct(id: EntitlementProductId | null) {
  return useQuery<EntitlementProduct>({
    queryKey: entitlementProductQueryKeys.detail(id),
    queryFn: () => getEntitlementProduct(id as EntitlementProductId, true),
    enabled: id !== null && id !== undefined,
  })
}

function invalidateProducts(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: ['brand-entitlement-products'],
    refetchType: 'all',
  })
  queryClient.invalidateQueries({ queryKey: ['brand-entitlement-product'] })
}

export function useCreateEntitlementProduct() {
  const queryClient = useQueryClient()
  return useMutation<EntitlementProduct, Error, CreateEntitlementProductInput>({
    mutationFn: (input) => createEntitlementProduct(input, true),
    onSuccess: () => invalidateProducts(queryClient),
  })
}

export function useUpdateEntitlementProduct() {
  const queryClient = useQueryClient()
  return useMutation<
    EntitlementProduct,
    Error,
    { id: EntitlementProductId; data: UpdateEntitlementProductInput }
  >({
    mutationFn: ({ id, data }) => updateEntitlementProduct(id, data, true),
    onSuccess: () => invalidateProducts(queryClient),
  })
}

export function useUpdateEntitlementProductStatus() {
  const queryClient = useQueryClient()
  return useMutation<
    EntitlementProduct,
    Error,
    { id: EntitlementProductId; status: EntitlementProductStatus }
  >({
    mutationFn: ({ id, status }) =>
      updateEntitlementProductStatus(id, status, true),
    onSuccess: () => invalidateProducts(queryClient),
  })
}
