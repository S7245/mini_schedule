// 全端统一的类型化 API 错误（P1 决策 1：code!=='OK' 即 throw；toast 由各端 Notifier 决定）。

export class CoreApiError extends Error {
  readonly code: string
  readonly details?: unknown

  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'CoreApiError'
    this.code = code
    this.details = details
  }
}

export function isCoreApiError(e: unknown): e is CoreApiError {
  return e instanceof CoreApiError
}
