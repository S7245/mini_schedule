import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  CreateLocationInput,
  Location,
  LocationStatus,
  PageResponse,
  UpdateLocationInput,
} from '@mini-schedule/types'
import { onboardingQueryKeys } from './onboarding'

// ─── Query keys ──────────────────────────────────────────

export type LocationId = number | string

export const locationQueryKeys = {
  list: (page: number, pageSize: number, status: LocationStatus | 'all') =>
    ['brand-locations', page, pageSize, status] as const,
  detail: (id: LocationId | null) => ['brand-location', id] as const,
}

// ─── Raw API calls ───────────────────────────────────────

export interface ListLocationsParams {
  page?: number
  page_size?: number
  status?: LocationStatus | 'all'
}

export function listLocations(params: ListLocationsParams = {}, silent = false) {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 1))
  search.set('page_size', String(params.page_size ?? 20))
  search.set('status', params.status ?? 'all')
  return http.get<PageResponse<Location>>(
    `/api/v1/brand/locations?${search.toString()}`,
    { silent },
  )
}

export function getLocation(id: LocationId, silent = false) {
  return http.get<Location>(`/api/v1/brand/locations/${id}`, { silent })
}

export function createLocation(input: CreateLocationInput, silent = false) {
  return http.post<Location>('/api/v1/brand/locations', input, { silent })
}

export function updateLocation(
  id: LocationId,
  input: UpdateLocationInput,
  silent = false,
) {
  return http.patch<Location>(`/api/v1/brand/locations/${id}`, input, { silent })
}

export function updateLocationStatus(
  id: LocationId,
  status: LocationStatus,
  silent = false,
) {
  return http.patch<Location>(
    `/api/v1/brand/locations/${id}/status`,
    { status },
    { silent },
  )
}

export function deleteLocation(id: LocationId, silent = false) {
  return http.delete<void>(`/api/v1/brand/locations/${id}`, { silent })
}

// ─── React Query hooks ───────────────────────────────────

export function useBrandLocations(
  page = 1,
  pageSize = 20,
  status: LocationStatus | 'all' = 'all',
) {
  return useQuery<PageResponse<Location>>({
    queryKey: locationQueryKeys.list(page, pageSize, status),
    queryFn: () => listLocations({ page, page_size: pageSize, status }, true),
  })
}

export function useBrandLocation(id: LocationId | null) {
  return useQuery<Location>({
    queryKey: locationQueryKeys.detail(id),
    queryFn: () => getLocation(id as LocationId, true),
    enabled: id !== null && id !== undefined,
  })
}

function invalidateLocations(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['brand-locations'] })
  queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
}

export function useCreateBrandLocation() {
  const queryClient = useQueryClient()

  return useMutation<Location, Error, CreateLocationInput>({
    mutationFn: (input) => createLocation(input, true),
    onSuccess: () => invalidateLocations(queryClient),
  })
}

export function useUpdateBrandLocation() {
  const queryClient = useQueryClient()

  return useMutation<Location, Error, { id: LocationId; data: UpdateLocationInput }>({
    mutationFn: ({ id, data }) => updateLocation(id, data, true),
    onSuccess: (_, { id }) => {
      invalidateLocations(queryClient)
      queryClient.invalidateQueries({ queryKey: locationQueryKeys.detail(id) })
    },
  })
}

export function useUpdateBrandLocationStatus() {
  const queryClient = useQueryClient()

  return useMutation<Location, Error, { id: LocationId; status: LocationStatus }>({
    mutationFn: ({ id, status }) => updateLocationStatus(id, status, true),
    onSuccess: (_, { id }) => {
      invalidateLocations(queryClient)
      queryClient.invalidateQueries({ queryKey: locationQueryKeys.detail(id) })
    },
  })
}

export function useDeleteBrandLocation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, LocationId>({
    mutationFn: (id) => deleteLocation(id, true),
    onSuccess: () => invalidateLocations(queryClient),
  })
}
