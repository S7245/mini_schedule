/**
 * Backend error codes — mirrors backend pkg/errors/error.go
 */

export const ErrorCodes = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_DUPLICATE_PHONE: 'AUTH_DUPLICATE_PHONE',
  AUTH_DUPLICATE_USERNAME: 'AUTH_DUPLICATE_USERNAME',

  // Brand
  BRAND_NOT_FOUND: 'BRAND_NOT_FOUND',
  BRAND_DISABLED: 'BRAND_DISABLED',

  // User
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_DUPLICATE_PHONE: 'USER_DUPLICATE_PHONE',

  // Course
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',

  // Training
  TRAINING_NOT_FOUND: 'TRAINING_NOT_FOUND',

  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * Backend API response shape
 */
export interface ApiResponse<T = unknown> {
  code: string | null
  message: string
  data: T
}

export interface ApiError {
  code: string
  message: string
  httpStatus: number
}

/**
 * Custom API error class
 */
export class ApiErrorClass extends Error {
  code: string
  httpStatus: number

  constructor(code: string, message: string, httpStatus: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.httpStatus = httpStatus
  }
}
