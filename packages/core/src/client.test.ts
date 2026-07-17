import { describe, it, expect } from 'vitest'
import { createApiClient } from './client'
import { isCoreApiError } from './errors'
import type { ApiEnvelope, HttpClient, HttpRequest } from './ports'

function fakeHttp(handler: (req: HttpRequest) => ApiEnvelope<unknown>): { http: HttpClient; calls: HttpRequest[] } {
  const calls: HttpRequest[] = []
  return {
    calls,
    http: {
      request: async <T>(req: HttpRequest) => {
        calls.push(req)
        return handler(req) as ApiEnvelope<T>
      },
    },
  }
}

describe('createApiClient', () => {
  it('returns data directly on code OK and maps method/path/body', async () => {
    const { http, calls } = fakeHttp(() => ({ code: 'OK', message: 'ok', data: { id: 7 } }))
    const api = createApiClient(http)
    const out = await api.post<{ id: number }>('/api/v1/app/x', { a: 1 })
    expect(out).toEqual({ id: 7 })
    expect(calls[0]).toMatchObject({ method: 'POST', path: '/api/v1/app/x', body: { a: 1 } })
  })

  it('throws CoreApiError with envelope code/message/details on business error', async () => {
    const { http } = fakeHttp(() => ({ code: 'UNAUTHORIZED', message: '请先登录', data: { hint: 1 } }))
    const api = createApiClient(http)
    const err: unknown = await api.get('/x').catch((e) => e)
    expect(isCoreApiError(err)).toBe(true)
    if (!isCoreApiError(err)) throw new Error('expected CoreApiError')
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.message).toBe('请先登录')
    expect(err.details).toEqual({ hint: 1 })
  })

  it('throws MALFORMED_RESPONSE when envelope shape is broken', async () => {
    const { http } = fakeHttp(() => ({}) as ApiEnvelope<unknown>)
    const api = createApiClient(http)
    const err: unknown = await api.get('/x').catch((e) => e)
    expect(isCoreApiError(err)).toBe(true)
    if (!isCoreApiError(err)) throw new Error('expected CoreApiError')
    expect(err.code).toBe('MALFORMED_RESPONSE')
  })

  it('propagates transport-layer throws untouched', async () => {
    const boom = new Error('socket hang up')
    const http: HttpClient = { request: async () => { throw boom } }
    const api = createApiClient(http)
    await expect(api.delete('/x')).rejects.toBe(boom)
  })

  it('exposes all five verbs incl. PATCH', async () => {
    const { http, calls } = fakeHttp(() => ({ code: 'OK', message: '', data: null }))
    const api = createApiClient(http)
    await api.get('/g'); await api.post('/p'); await api.put('/u'); await api.patch('/pa'); await api.delete('/d')
    expect(calls.map((c) => c.method)).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  })
})
