'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  useMyPermissions,
  type MeDataScope,
  type MyPermissionsResponse,
} from '@mini-schedule/api/me'
import { useAuthStore } from '@mini-schedule/api/auth'

/**
 * Canonical permission codes exposed by the backend brand RBAC model.
 *
 * Always reference codes through `PERMISSIONS.XXX` rather than bare string
 * literals — TypeScript catches typos this way (and a code rename only needs a
 * single edit here). Backend SoT: `permissions` table + Batch 6 spec.
 */
export const PERMISSIONS = {
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_EDIT: 'staff.edit',
  STAFF_DELETE: 'staff.delete',
  STAFF_ASSIGN_ROLE: 'staff.assign_role',
  STAFF_ASSIGN_LOCATION: 'staff.assign_location',

  LOCATION_VIEW: 'location.view',
  LOCATION_CREATE: 'location.create',
  LOCATION_EDIT: 'location.edit',
  LOCATION_DELETE: 'location.delete',

  BRAND_PROFILE_VIEW: 'brand.profile.view',
  BRAND_PROFILE_EDIT: 'brand.profile.edit',

  INSTRUCTOR_VIEW: 'instructor.view',
  INSTRUCTOR_EDIT: 'instructor.edit',

  ROLE_MANAGE: 'role.manage',

  // Course Category (Batch 11)
  COURSE_CATEGORY_VIEW: 'course_category.view',
  COURSE_CATEGORY_CREATE: 'course_category.create',
  COURSE_CATEGORY_EDIT: 'course_category.edit',

  // Course Template (Batch 11)
  COURSE_VIEW: 'course.view',
  COURSE_CREATE: 'course.create',
  COURSE_EDIT: 'course.edit',
  COURSE_DELETE: 'course.delete',

  // Class Session (Batch 11)
  SESSION_VIEW: 'session.view',
  SESSION_CREATE: 'session.create',
  SESSION_CANCEL: 'session.cancel',
} as const

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

interface PermissionsContextValue {
  permissions: Set<string>
  dataScope: MeDataScope
  has: (code: string) => boolean
  isLoading: boolean
  isError: boolean
}

const EMPTY_SCOPE: MeDataScope = { kind: 'none' }

/**
 * Default context value — used when no provider is mounted (SSR / tests).
 *
 * fail-closed: `has()` always returns false; the consuming UI should treat
 * everything as denied until the provider proves otherwise.
 */
const DEFAULT_VALUE: PermissionsContextValue = {
  permissions: new Set<string>(),
  dataScope: EMPTY_SCOPE,
  has: () => false,
  isLoading: false,
  isError: false,
}

const PermissionsContext =
  createContext<PermissionsContextValue>(DEFAULT_VALUE)

export interface PermissionsProviderProps {
  children: ReactNode
}

/**
 * Fetches `/me/permissions` once per session window (60s staleTime + refetch on
 * focus) and exposes the effective permission set + data scope through context.
 *
 * Guarantees:
 *  - `has(code)` returns `false` while loading and on error (fail-closed).
 *    UI buttons therefore start disabled and only become enabled once the
 *    permission set is actually known.
 *  - Only fires the request when the user is authenticated as a brand user;
 *    skipping it on unauthenticated paths avoids a spurious 401.
 */
export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { isAuthenticated, user } = useAuthStore()
  const enabled = isAuthenticated && user?.user_type === 'brand'

  const query = useMyPermissions({ enabled })

  const value = useMemo<PermissionsContextValue>(() => {
    const data: MyPermissionsResponse | undefined = query.data
    // Fail-closed: while loading, when disabled, or when an error happened we
    // ship an empty set. The cost of being wrong here is "user briefly sees a
    // disabled button"; the cost of the inverse is "user sees an enabled
    // button they cannot use, hits 403 on submit."
    if (!data || query.isLoading || query.isError || !enabled) {
      return {
        permissions: new Set<string>(),
        dataScope: EMPTY_SCOPE,
        has: () => false,
        isLoading: query.isLoading,
        isError: query.isError,
      }
    }
    const permissions = new Set(data.permissions)
    return {
      permissions,
      dataScope: data.data_scope ?? EMPTY_SCOPE,
      has: (code: string) => permissions.has(code),
      isLoading: false,
      isError: false,
    }
  }, [query.data, query.isLoading, query.isError, enabled])

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

/**
 * Read the current brand user's effective permissions.
 *
 * Always returns a stable shape — `has()` never throws and always returns
 * boolean. If no provider is mounted the default fail-closed value is used.
 */
export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext)
}
