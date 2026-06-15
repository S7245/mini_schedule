import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type {
  InstructorProfile,
  SchedulableInstructor,
  UpsertInstructorProfileInput,
} from '@mini-schedule/types'
import { onboardingQueryKeys } from './onboarding'
import { staffQueryKeys, type StaffId } from './staff'

// ─── Query keys ──────────────────────────────────────────

export const instructorQueryKeys = {
  byStaff: (staffId: StaffId | null) =>
    ['brand-staff-instructor', staffId] as const,
  schedulable: () => ['brand-instructors-schedulable'] as const,
}

// ─── Schedulable instructor list (Batch 11 — create-session dialog) ──────────
//
// ASSUMPTION (backend must match): GET /api/v1/brand/instructors?schedulable=true
// returns { items: [{ id, display_name, status, is_schedulable }] } where `id`
// is the instructor_profile_id used by POST /class-sessions. The staff list
// endpoint does not expose instructor_profile_id, so this dedicated read is
// required to populate the instructor selector.

export function listSchedulableInstructors(silent = false) {
  return http.get<{ items: SchedulableInstructor[] }>(
    '/api/v1/brand/instructors?schedulable=true',
    { silent },
  )
}

export function useSchedulableInstructors(enabled = true) {
  return useQuery<{ items: SchedulableInstructor[] }>({
    queryKey: instructorQueryKeys.schedulable(),
    queryFn: () => listSchedulableInstructors(true),
    enabled,
  })
}

// ─── Raw API calls ───────────────────────────────────────

export function getStaffInstructor(staffId: StaffId, silent = false) {
  return http.get<InstructorProfile>(
    `/api/v1/brand/staff/${staffId}/instructor`,
    { silent },
  )
}

export function upsertStaffInstructor(
  staffId: StaffId,
  input: UpsertInstructorProfileInput,
  silent = false,
) {
  return http.put<InstructorProfile>(
    `/api/v1/brand/staff/${staffId}/instructor`,
    input,
    { silent },
  )
}

export function deleteStaffInstructor(staffId: StaffId, silent = false) {
  return http.delete<void>(`/api/v1/brand/staff/${staffId}/instructor`, {
    silent,
  })
}

// ─── React Query hooks ───────────────────────────────────

/**
 * Fetches the instructor profile attached to a staff. Returns `undefined`
 * when 404 (staff is not an instructor yet); caller distinguishes via the
 * `isError` + `error.code === INSTRUCTOR_PROFILE_NOT_FOUND` pair, OR by
 * pre-checking `staff.has_instructor` from the staff detail.
 */
export function useStaffInstructor(staffId: StaffId | null, enabled = true) {
  return useQuery<InstructorProfile>({
    queryKey: instructorQueryKeys.byStaff(staffId),
    queryFn: () => getStaffInstructor(staffId as StaffId, true),
    enabled: enabled && staffId !== null && staffId !== undefined,
    retry: false,
  })
}

function invalidateInstructor(
  queryClient: ReturnType<typeof useQueryClient>,
  staffId: StaffId,
) {
  queryClient.invalidateQueries({
    queryKey: instructorQueryKeys.byStaff(staffId),
  })
  // Detail returns embedded instructor_profile + has_instructor flag.
  queryClient.invalidateQueries({ queryKey: staffQueryKeys.detail(staffId) })
  queryClient.invalidateQueries({ queryKey: ['brand-staff-list'] })
  queryClient.invalidateQueries({ queryKey: onboardingQueryKeys.status() })
}

export function useUpsertStaffInstructor() {
  const queryClient = useQueryClient()
  return useMutation<
    InstructorProfile,
    Error,
    { staffId: StaffId; data: UpsertInstructorProfileInput }
  >({
    mutationFn: ({ staffId, data }) => upsertStaffInstructor(staffId, data, true),
    onSuccess: (_, { staffId }) => invalidateInstructor(queryClient, staffId),
  })
}

export function useDeleteStaffInstructor() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, StaffId>({
    mutationFn: (staffId) => deleteStaffInstructor(staffId, true),
    onSuccess: (_, staffId) => invalidateInstructor(queryClient, staffId),
  })
}
