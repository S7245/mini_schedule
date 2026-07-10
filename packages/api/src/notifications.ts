import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './client'

// Batch 18 — 后台站内通知中心（§20.13）。recipient 恒为当前登录 brand_user。

export type NotificationStatusFilter = 'all' | 'unread' | 'read'

export interface NotificationItem {
  id: number
  event_type: string
  title: string
  body: string
  status: string // sent | read
  related_type: string
  related_id: number
  read_at: string | null
  created_at: string
}

export interface NotificationListResult {
  items: NotificationItem[]
  total: number
  unread: number
}

export interface NotificationListParams {
  status?: NotificationStatusFilter
  page?: number
  page_size?: number
}

export const notificationQueryKeys = {
  list: (p: NotificationListParams) => ['brand-notifications', p] as const,
  unread: ['brand-notifications-unread'] as const,
}

export function getNotifications(params: NotificationListParams, silent = false) {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.page) qs.set('page', String(params.page))
  if (params.page_size) qs.set('page_size', String(params.page_size))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return http.get<NotificationListResult>(
    `/api/v1/brand/notifications${suffix}`,
    { silent },
  )
}

export function useNotifications(params: NotificationListParams, enabled = true) {
  return useQuery<NotificationListResult>({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => getNotifications(params, true),
    enabled,
  })
}

export function useUnreadCount(enabled = true) {
  return useQuery<{ count: number }>({
    queryKey: notificationQueryKeys.unread,
    queryFn: () =>
      http.get<{ count: number }>('/api/v1/brand/notifications/unread-count', {
        silent: true,
      }),
    enabled,
    refetchInterval: 30_000, // 轮询未读数（徽标同源）
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation<NotificationItem, Error, number>({
    mutationFn: (id: number) =>
      http.post<NotificationItem>(`/api/v1/brand/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-notifications'] })
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation<{ updated: number }, Error, void>({
    mutationFn: () =>
      http.post<{ updated: number }>('/api/v1/brand/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-notifications'] })
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread })
    },
  })
}
