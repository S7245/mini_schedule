// 学员端登录（当前后端为 mock：openid = "dev_"+code；换真 code2session 时本函数零改动）。

import type { ApiClient } from '../client'

export interface WechatLoginInput {
  brandId: number
  code: string
  nickname?: string
}

export interface AppUserInfo {
  id: number
  brand_id: number
  nickname: string
  avatar_url: string
  vip_level: string
}

export interface WechatLoginResult {
  access_token: string
  refresh_token: string
  user: AppUserInfo | null
  is_new_user: boolean
}

export function wechatLogin(client: ApiClient, input: WechatLoginInput): Promise<WechatLoginResult> {
  return client.post('/api/v1/app/auth/wechat-login', {
    brand_id: input.brandId,
    code: input.code,
    ...(input.nickname ? { nickname: input.nickname } : {}),
  })
}
