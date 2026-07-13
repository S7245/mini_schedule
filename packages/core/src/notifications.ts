// 站内通知事件类型 → 中文标签 + 时间格式化。无 UI/平台依赖，供全端复用。
// 注：formatNotificationTime 目前用 toLocaleString，与现有 Web 行为一致（零回归）。
// 小程序引擎 Intl 支持弱 —— 若 P1 (Taro) 发现格式异常，再改为手写补零格式（见蓝图风险表）。

export const NOTIFICATION_EVENT_LABELS: Record<string, string> = {
  booking_created: '新预约',
  booking_cancelled: '预约取消',
  waitlist_changed: '候补变化',
  attendance_pending_noshow: '待确认爽约',
  session_cancelled: '场次取消',
  quota_near_limit: '额度已达上限',
  subscription_abnormal: '订阅受限',
  subscription_expiring: '订阅即将到期',
}

export function notificationEventLabel(eventType: string): string {
  return NOTIFICATION_EVENT_LABELS[eventType] ?? eventType
}

export function formatNotificationTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
