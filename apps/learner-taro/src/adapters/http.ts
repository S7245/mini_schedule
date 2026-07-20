import Taro from '@tarojs/taro'
import { CoreApiError } from '@mini-schedule/core/errors'
import type { ApiEnvelope, AuthTokenStore, HttpClient, HttpRequest } from '@mini-schedule/core/ports'

// HttpClient 的 Taro 实现：weapp 走原生请求（devtools 关 urlCheck），h5 走 XHR（dev 同源 proxy）。
export class TaroHttpClient implements HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenStore: AuthTokenStore,
  ) {}

  async request<T>(req: HttpRequest): Promise<ApiEnvelope<T>> {
    const token = await this.tokenStore.getAccessToken()
    try {
      const res = await Taro.request<ApiEnvelope<T>>({
        url: this.baseUrl + req.path,
        method: req.method,
        data: req.body as string | Record<string, unknown> | undefined,
        header: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...req.headers,
        },
      })
      return res.data
    } catch (e) {
      throw new CoreApiError('NETWORK_ERROR', '网络请求失败，请稍后重试', e)
    }
  }
}
