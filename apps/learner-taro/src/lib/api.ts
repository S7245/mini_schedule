import { createApiClient } from '@mini-schedule/core/client'
import { createAuthTokenStore } from '@mini-schedule/core/ports'
import { TaroHttpClient } from '../adapters/http'
import { TaroStorage } from '../adapters/storage'

const API_BASE =
  process.env.TARO_ENV === 'h5' ? '' : process.env.TARO_APP_API_BASE || 'http://localhost:8082'

export const DEFAULT_BRAND_ID = Number(process.env.TARO_APP_DEFAULT_BRAND_ID) || 1
export const REFRESH_TOKEN_KEY = 'ms-refresh-token'

export const storage = new TaroStorage()
export const authStore = createAuthTokenStore(storage)
export const api = createApiClient(new TaroHttpClient(API_BASE, authStore))
