import { toast } from 'sonner'
import { ApiResponse, ApiErrorClass, ErrorCodes } from './errors'

interface RequestInitExtended extends RequestInit {
  silent?: boolean
}

/**
 * Unified API client
 *
 * - Uses same-origin Next rewrites for browser requests that have app proxies
 * - Reads NEXT_PUBLIC_API_URL from env for direct server-side or non-proxied requests
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

function shouldUseSameOriginProxy(path: string): boolean {
  return path.startsWith('/api/v1/admin/') || path.startsWith('/api/v1/brand/') || path.startsWith('/api/v1/public/')
}

function getRequestUrl(path: string): string {
  if (typeof window !== 'undefined' && shouldUseSameOriginProxy(path)) {
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

  // 204 No Content (and any other empty body) has nothing to parse. Backend
  // delete endpoints return 204, so calling response.json() here would throw a
  // SyntaxError and reject an otherwise-successful request. Treat an empty body
  // as success-with-no-data; if the empty response is itself an error status,
  // surface a generic API error instead.
  const rawBody = await response.text()
  if (!rawBody) {
    if (!response.ok) {
      const apiError = new ApiErrorClass(
        'UNKNOWN_ERROR',
        `请求失败 (${response.status})`,
        response.status,
      )
      if (!silent) {
        showErrorToast(apiError)
      }
      throw apiError
    }
    return undefined as T
  }

  const json: ApiResponse<T> = JSON.parse(rawBody)

  // Backend success responses currently use code === "OK".
  if (json.code !== 'OK') {
    const apiError = new ApiErrorClass(
      json.code ?? 'UNKNOWN_ERROR',
      json.message,
      response.status,
      json.data,
    )

    if (!silent) {
      showErrorToast(apiError)
    }

    throw apiError
  }

  return json.data
}

/**
 * Pull the `required` permission code out of a PERMISSION_DENIED error payload.
 * Backend shape (Batch 6): `data: { required: string, missing: string[] }`.
 */
function getRequiredPermission(err: ApiErrorClass): string | null {
  const data = err.data
  if (data && typeof data === 'object' && 'required' in data) {
    const v = (data as { required: unknown }).required
    if (typeof v === 'string') return v
  }
  return null
}

/**
 * Show a toast for an API error, with dedup for PERMISSION_DENIED.
 *
 * - PERMISSION_DENIED: surface 权限不足: <code> so the user knows which
 *   permission is missing. We pin the toast id to `perm-<code>` so rapid
 *   navigation through a denied area only shows one toast at a time (sonner
 *   replaces toasts that share an id).
 * - Everything else: plain message toast — pre-Batch-6 behaviour.
 */
function showErrorToast(err: ApiErrorClass) {
  if (err.code === ErrorCodes.PERMISSION_DENIED) {
    const required = getRequiredPermission(err)
    const message = required
      ? `权限不足: ${required}`
      : err.message || '权限不足'
    const id = `perm-${required ?? 'unknown'}`
    toast.error(message, { id })
    return
  }
  toast.error(err.message)
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
