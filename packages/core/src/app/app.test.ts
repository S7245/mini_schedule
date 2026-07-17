import { describe, it, expect } from 'vitest'
import { createApiClient } from '../client'
import type { ApiEnvelope, HttpClient, HttpRequest } from '../ports'
import { wechatLogin } from './auth'
import { getMyProfile } from './learner'

function clientWith(data: unknown) {
  const calls: HttpRequest[] = []
  const http: HttpClient = {
    request: async <T>(req: HttpRequest) => {
      calls.push(req)
      return { code: 'OK', message: 'ok', data } as ApiEnvelope<T>
    },
  }
  return { api: createApiClient(http), calls }
}

describe('app/auth', () => {
  it('wechatLogin posts snake_case body and returns login result', async () => {
    const result = {
      access_token: 'at', refresh_token: 'rt', is_new_user: true,
      user: { id: 1, brand_id: 21, nickname: '小明', avatar_url: '', vip_level: 'normal' },
    }
    const { api, calls } = clientWith(result)
    const out = await wechatLogin(api, { brandId: 21, code: 'dev-abc', nickname: '小明' })
    expect(out).toEqual(result)
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/app/auth/wechat-login',
      body: { brand_id: 21, code: 'dev-abc', nickname: '小明' },
    })
  })
  it('wechatLogin omits nickname when absent', async () => {
    const { api, calls } = clientWith({ access_token: 'a', refresh_token: 'r', is_new_user: false, user: null })
    await wechatLogin(api, { brandId: 21, code: 'c' })
    expect(calls[0].body).toEqual({ brand_id: 21, code: 'c' })
  })
})

describe('app/learner', () => {
  it('getMyProfile GETs /api/v1/app/profile', async () => {
    const profile = { id: 9, nickname: '小明', avatar_url: null, vip_level: 'normal', phone: null }
    const { api, calls } = clientWith(profile)
    expect(await getMyProfile(api)).toEqual(profile)
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/api/v1/app/profile' })
  })
})
