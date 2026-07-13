// 站内通知事件类型 → 中文标签 + 时间格式化，供 /notifications 页与首页概览复用（Batch 18/19）。

export const NOTIFICATION_EVENT_LABELS: Record<string, string> = {
  booking_created: '新预约',
  booking_cancelled: '预约取消',
  waitlist_changed: '候补变化',
  attendance_pending_noshow: '待确认爽约',
  session_cancelled: '场次取消',
  quota_near_limit: '额度已达上限',
  subscription_abnormal: '订阅受限',
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
