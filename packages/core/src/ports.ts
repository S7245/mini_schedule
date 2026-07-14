// 平台差异注入契约（多端蓝图 P0）。core 不 import 任何平台 API；
// 各端（Web/RN/小程序/桌面）启动时注入自己的实现。异步取 RN/小程序 Storage 的最低公约数。

export interface KeyValueStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

// 鉴权 token 存取。可用 KeyValueStorage 组合实现（见 ports.test.ts）。
export interface AuthTokenStore {
  getAccessToken(): Promise<string | null>
  setAccessToken(token: string | null): Promise<void>
}

// 统一响应封装，对齐后端 { code, message, data }。
export interface ApiEnvelope<T> {
  code: string
  message: string
  data: T
}

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  headers?: Record<string, string>
}

// 网络请求注入契约。Web 用 fetch、RN 用 fetch、小程序用 wx.request，各端各实现。
export interface HttpClient {
  request<T>(req: HttpRequest): Promise<ApiEnvelope<T>>
}
