import { toast } from 'sonner'
import { ApiResponse, ApiErrorClass } from './errors'

interface RequestInitExtended extends RequestInit {
  silent?: boolean
}

/**
 * Unified API client
 *
 * - Reads NEXT_PUBLIC_API_URL from env
 * - Parses {code, message, data} responses
 * - Auto-shows toast on errors unless {silent: true}
 * - Attaches JWT token from localStorage if available
 */

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) throw new Error('NEXT_PUBLIC_API_URL is not defined')
  return url
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.state?.accessToken ?? null
  } catch {
    return null
  }
}

function shouldUseCookieAuth(path: string): boolean {
  return path.startsWith('/api/v1/admin/')
}

function getRequestUrl(path: string): string {
  if (typeof window !== 'undefined' && shouldUseCookieAuth(path)) {
    return path
  }

  return `${getBaseUrl()}${path}`
}

export async function api<T>(
  path: string,
  options: RequestInitExtended = {}
): Promise<T> {
  const { silent = false, ...fetchOptions } = options

  const url = getRequestUrl(path)
  const token = shouldUseCookieAuth(path) ? null : getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  })

  const json: ApiResponse<T> = await response.json()

  // Backend success responses currently use code === "OK".
  if (json.code !== 'OK') {
    const apiError = new ApiErrorClass(json.code ?? 'UNKNOWN_ERROR', json.message, response.status)

    if (!silent) {
      toast.error(json.message)
    }

    throw apiError
  }

  return json.data
}

/**
 * Convenience methods
 */
export const http = {
  get: <T>(path: string, opts?: RequestInitExtended) =>
    api<T>(path, { method: 'GET', ...opts }),

  post: <T>(path: string, body?: unknown, opts?: RequestInitExtended) =>
    api<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  put: <T>(path: string, body?: unknown, opts?: RequestInitExtended) =>
    api<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  patch: <T>(path: string, body?: unknown, opts?: RequestInitExtended) =>
    api<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  delete: <T>(path: string, opts?: RequestInitExtended) =>
    api<T>(path, { method: 'DELETE', ...opts }),
}
