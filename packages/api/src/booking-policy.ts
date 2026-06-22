import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type { BookingPolicy } from '@mini-schedule/types'

export const bookingPolicyQueryKeys = {
  default: () => ['brand-booking-policy'] as const,
}

export function getBookingPolicy(silent = false) {
  return http.get<BookingPolicy>('/api/v1/brand/booking-policy', { silent })
}

export function upsertBookingPolicy(input: BookingPolicy, silent = false) {
  return http.put<BookingPolicy>('/api/v1/brand/booking-policy', input, {
    silent,
  })
}

export function useBookingPolicy(enabled = true) {
  return useQuery<BookingPolicy>({
    queryKey: bookingPolicyQueryKeys.default(),
    queryFn: () => getBookingPolicy(true),
    enabled,
  })
}

export function useUpsertBookingPolicy() {
  const queryClient = useQueryClient()
  return useMutation<BookingPolicy, Error, BookingPolicy>({
    mutationFn: (input) => upsertBookingPolicy(input, true),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bookingPolicyQueryKeys.default(),
        refetchType: 'all',
      })
    },
  })
}
