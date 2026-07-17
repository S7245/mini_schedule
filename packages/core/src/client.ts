// 无头 API 客户端：包一层注入的 HttpClient，统一 envelope 解析与错误语义。
// code==='OK' → 返回 data；否则 throw CoreApiError（details = envelope.data，
// 对齐后端把 AppError.Details 序列化进 Response.Data 的惯例）。

import { CoreApiError } from './errors'
import type { HttpClient, HttpRequest } from './ports'

export interface ApiClient {
  get<T>(path: string, headers?: Record<string, string>): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  put<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
}

export function createApiClient(http: HttpClient): ApiClient {
  async function run<T>(req: HttpRequest): Promise<T> {
    const envelope = await http.request<T>(req)
    if (!envelope || typeof envelope.code !== 'string') {
      throw new CoreApiError('MALFORMED_RESPONSE', '响应格式异常')
    }
    if (envelope.code !== 'OK') {
      throw new CoreApiError(envelope.code, envelope.message || '请求失败', envelope.data)
    }
    return envelope.data
  }

  return {
    get: (path, headers) => run({ method: 'GET', path, headers }),
    post: (path, body) => run({ method: 'POST', path, body }),
    put: (path, body) => run({ method: 'PUT', path, body }),
    patch: (path, body) => run({ method: 'PATCH', path, body }),
    delete: (path) => run({ method: 'DELETE', path }),
  }
}
