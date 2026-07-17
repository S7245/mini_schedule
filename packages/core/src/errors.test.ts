import { describe, it, expect } from 'vitest'
import { CoreApiError, isCoreApiError } from './errors'

describe('CoreApiError', () => {
  it('carries code/message/details and is an Error', () => {
    const e = new CoreApiError('QUOTA_EXCEEDED', '已达套餐上限', { current: 3, max: 3 })
    expect(e).toBeInstanceOf(Error)
    expect(e.name).toBe('CoreApiError')
    expect(e.code).toBe('QUOTA_EXCEEDED')
    expect(e.message).toBe('已达套餐上限')
    expect(e.details).toEqual({ current: 3, max: 3 })
  })
  it('isCoreApiError narrows correctly', () => {
    expect(isCoreApiError(new CoreApiError('X', 'x'))).toBe(true)
    expect(isCoreApiError(new Error('x'))).toBe(false)
    expect(isCoreApiError(null)).toBe(false)
  })
})
