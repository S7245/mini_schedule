import { describe, it, expect } from 'vitest'
import {
  NOTIFICATION_EVENT_LABELS,
  notificationEventLabel,
  formatNotificationTime,
} from './notifications'

describe('notificationEventLabel', () => {
  it('maps known event types to Chinese labels', () => {
    expect(notificationEventLabel('booking_created')).toBe('新预约')
    expect(notificationEventLabel('subscription_expiring')).toBe('订阅即将到期')
  })
  it('falls back to the raw event type when unknown', () => {
    expect(notificationEventLabel('mystery_event')).toBe('mystery_event')
  })
  it('exposes all 8 current event labels', () => {
    expect(Object.keys(NOTIFICATION_EVENT_LABELS)).toHaveLength(8)
  })
})

describe('formatNotificationTime', () => {
  it('passes through an unparseable string unchanged', () => {
    expect(formatNotificationTime('not-a-date')).toBe('not-a-date')
  })
  it('renders a non-empty string for a valid ISO time', () => {
    const out = formatNotificationTime('2026-07-13T12:00:00Z')
    expect(out.length).toBeGreaterThan(0)
    expect(out).toContain('13')
  })
})
