import { describe, it, expect } from 'vitest'
import type { KeyValueStorage, AuthTokenStore, HttpClient } from './ports'

// 内存实现：证明接口可被真实实现（未来 Web/RN/小程序各注入自己的）。
class InMemoryStorage implements KeyValueStorage {
  private m = new Map<string, string>()
  async get(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null
  }
  async set(k: string, v: string) {
    this.m.set(k, v)
  }
  async remove(k: string) {
    this.m.delete(k)
  }
}

// AuthTokenStore 可由 KeyValueStorage 组合实现（各端复用同一套逻辑）。
function makeAuthTokenStore(storage: KeyValueStorage, key = 'access-token'): AuthTokenStore {
  return {
    getAccessToken: () => storage.get(key),
    setAccessToken: async (token) => {
      if (token === null) await storage.remove(key)
      else await storage.set(key, token)
    },
  }
}

describe('ports', () => {
  it('KeyValueStorage round-trips a value', async () => {
    const s = new InMemoryStorage()
    await s.set('k', 'v')
    expect(await s.get('k')).toBe('v')
    await s.remove('k')
    expect(await s.get('k')).toBeNull()
  })

  it('AuthTokenStore stores and clears a token over KeyValueStorage', async () => {
    const auth = makeAuthTokenStore(new InMemoryStorage())
    expect(await auth.getAccessToken()).toBeNull()
    await auth.setAccessToken('jwt-abc')
    expect(await auth.getAccessToken()).toBe('jwt-abc')
    await auth.setAccessToken(null)
    expect(await auth.getAccessToken()).toBeNull()
  })

  it('HttpClient interface is structurally usable', async () => {
    const fake: HttpClient = {
      request: async <T>() => ({ code: 'OK', message: 'ok', data: null as T }),
    }
    const res = await fake.request<{ id: number } | null>({ method: 'GET', path: '/x' })
    expect(res.code).toBe('OK')
  })
})
