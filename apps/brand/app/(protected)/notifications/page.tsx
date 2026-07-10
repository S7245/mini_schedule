'use client'

import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationStatusFilter,
  type NotificationItem,
} from '@mini-schedule/api/notifications'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const EVENT_LABELS: Record<string, string> = {
  booking_created: '新预约',
  booking_cancelled: '预约取消',
  waitlist_changed: '候补变化',
  attendance_pending_noshow: '待确认爽约',
  session_cancelled: '场次取消',
}

const FILTERS: { value: NotificationStatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
]

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationRow({
  item,
  onRead,
  canMark,
  marking,
}: {
  item: NotificationItem
  onRead: (id: number) => void
  canMark: boolean
  marking: boolean
}) {
  const unread = item.status !== 'read'
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
      <span
        className={`mt-1.5 size-2 shrink-0 rounded-full ${
          unread ? 'bg-primary' : 'bg-transparent'
        }`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {EVENT_LABELS[item.event_type] ?? item.event_type}
          </span>
          <span className={`text-sm ${unread ? 'font-semibold' : 'font-medium'}`}>
            {item.title}
          </span>
        </div>
        {item.body && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {item.body}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatTime(item.created_at)}
        </p>
      </div>
      {unread && canMark && (
        <Button
          variant="ghost"
          size="sm"
          disabled={marking}
          onClick={() => onRead(item.id)}
        >
          标记已读
        </Button>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { has, isLoading: permsLoading } = usePermissions()
  const canView = has(PERMISSIONS.NOTIFICATION_VIEW)
  const canMark = has(PERMISSIONS.NOTIFICATION_MARK_READ)

  const [filter, setFilter] = useState<NotificationStatusFilter>('all')
  const { data, isLoading, isError } = useNotifications(
    { status: filter, page: 1, page_size: 50 },
    canView,
  )
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  if (!permsLoading && !canView) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-xl font-semibold tracking-tight">通知消息</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">无权查看通知</CardTitle>
            <CardDescription>
              该功能需要「查看通知」权限，请联系品牌管理员。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const items = data?.items ?? []
  const unread = data?.unread ?? 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Bell className="size-5" />
            通知消息
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread > 0 ? `${unread} 条未读` : '全部已读'}
          </p>
        </div>
        {canMark && unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="mr-1 size-4" />
            全部已读
          </Button>
        )}
      </div>

      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              加载中…
            </p>
          ) : isError ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              加载失败，请稍后重试。
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              暂无通知
            </p>
          ) : (
            items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                canMark={canMark}
                marking={markRead.isPending}
                onRead={(id) => markRead.mutate(id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
