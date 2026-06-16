import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CreateLocationResourceInput,
  LocationResource,
  LocationResourceListQuery,
  PageResponse,
  UpdateLocationResourceInput,
} from '@mini-schedule/types'

// ─── Query keys ──────────────────────────────────────────

export type LocationResourceId = number | string

export const locationResourceQueryKeys = {
  list: (query: LocationResourceListQuery) =>
    ['brand-location-resources', query] as const,
  detail: (id: LocationResourceId | null) =>
    ['brand-location-resource', id] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export function listLocationResources(
  query: LocationResourceListQuery,
  silent = false,
) {
  const search = new URLSearchParams()
  search.set('location_id', String(query.location_id))
  search.set('page', String(query.page ?? 1))
  search.set('page_size', String(query.page_size ?? 50))
  if (query.status && query.status !== 'all') search.set('status', query.status)
  return http.get<PageResponse<LocationResource>>(
    `/api/v1/brand/location-resources?${search.toString()}`,
    { silent },
  )
}

export function createLocationResource(
  input: CreateLocationResourceInput,
  silent = false,
) {
  return http.post<LocationResource>(
    '/api/v1/brand/location-resources',
    input,
    { silent },
  )
}

export function updateLocationResource(
  id: LocationResourceId,
  input: UpdateLocationResourceInput,
  silent = false,
) {
  return http.patch<LocationResource>(
    `/api/v1/brand/location-resources/${id}`,
    input,
    { silent },
  )
}

export function deleteLocationResource(id: LocationResourceId, silent = false) {
  return http.delete<null>(`/api/v1/brand/location-resources/${id}`, { silent })
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandLocationResources(
  query: LocationResourceListQuery,
  enabled = true,
) {
  return useQuery<PageResponse<LocationResource>>({
    queryKey: locationResourceQueryKeys.list(query),
    queryFn: () => listLocationResources(query, true),
    enabled: enabled && Boolean(query.location_id),
  })
}

function invalidateResources(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: ['brand-location-resources'],
    refetchType: 'all',
  })
}

export function useCreateLocationResource() {
  const queryClient = useQueryClient()
  return useMutation<LocationResource, Error, CreateLocationResourceInput>({
    mutationFn: (input) => createLocationResource(input, true),
    onSuccess: () => invalidateResources(queryClient),
  })
}

export function useUpdateLocationResource() {
  const queryClient = useQueryClient()
  return useMutation<
    LocationResource,
    Error,
    { id: LocationResourceId; data: UpdateLocationResourceInput }
  >({
    mutationFn: ({ id, data }) => updateLocationResource(id, data, true),
    onSuccess: () => invalidateResources(queryClient),
  })
}

export function useDeleteLocationResource() {
  const queryClient = useQueryClient()
  return useMutation<null, Error, LocationResourceId>({
    mutationFn: (id) => deleteLocationResource(id, true),
    onSuccess: () => invalidateResources(queryClient),
  })
}
