import type { ApiClient } from '../client'

export interface AppProfile {
  id: number
  nickname: string
  avatar_url: string | null
  vip_level: string
  phone: string | null
}

export function getMyProfile(client: ApiClient): Promise<AppProfile> {
  return client.get('/api/v1/app/profile')
}
