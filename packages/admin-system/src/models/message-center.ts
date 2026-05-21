export type MessageStatus = 'unread' | 'open' | 'resolved'
export type MessagePriority = 'high' | 'normal' | 'low'

export interface MessageCenterMetric {
  label: string
  value: string
  detail: string
}

export interface MessageCenterReplyTemplate {
  label: string
  body: string
}

export interface MessageCenterTimelineItem {
  label: string
  at: string
}

export interface MessageCenterItem {
  id: string
  title: string
  body: string
  sender: string
  sourceLabel: string
  receivedAt: string
  channel: string
  status: MessageStatus
  priority: MessagePriority
  audience: string
  owner: string
  assignee: string
  slaLabel: string
  nextStep: string
  suggestedReply: string
  timeline: MessageCenterTimelineItem[]
}

export interface MessageCenterFilters {
  status?: MessageStatus | 'all'
  priority?: MessagePriority | 'all'
  owner?: string
  query?: string
}

export interface MessageCenterQueueView {
  filteredMessages: MessageCenterItem[]
  selectedMessage?: MessageCenterItem
}

export type MessageCenterStatusCounts = Record<MessageStatus | 'all', number>
export type MessageCenterQueueAction =
  | 'mark-read'
  | 'reply'
  | 'resolve'
  | 'assign'

export interface MessageCenterQueueUpdate {
  action: MessageCenterQueueAction
  actor?: string
  assignee?: string
  body?: string
  at?: string
}

export function getMessageCenterStatusCounts(
  messages: MessageCenterItem[],
): MessageCenterStatusCounts {
  return messages.reduce<MessageCenterStatusCounts>(
    (counts, message) => ({
      ...counts,
      all: counts.all + 1,
      [message.status]: counts[message.status] + 1,
    }),
    {
      all: 0,
      unread: 0,
      open: 0,
      resolved: 0,
    },
  )
}

export function getMessageCenterOwners(messages: MessageCenterItem[]): string[] {
  return Array.from(
    new Set(messages.map((message) => message.owner).filter(Boolean)),
  )
}

export function getMessageCenterAssignees(
  messages: MessageCenterItem[],
): string[] {
  return Array.from(
    new Set(messages.map((message) => message.assignee).filter(Boolean)),
  )
}

export function filterMessageCenterItems(
  messages: MessageCenterItem[],
  {
    status = 'all',
    priority = 'all',
    owner = 'all',
    query = '',
  }: MessageCenterFilters = {},
): MessageCenterItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  return messages.filter((message) => {
    const matchesStatus = status === 'all' || message.status === status
    const matchesPriority =
      priority === 'all' || message.priority === priority
    const matchesOwner = owner === 'all' || message.owner === owner
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [
        message.title,
        message.body,
        message.sender,
        message.sourceLabel,
        message.channel,
        message.audience,
        message.owner,
        message.assignee,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedQuery)

    return matchesStatus && matchesPriority && matchesOwner && matchesQuery
  })
}

export function getMessageCenterQueueView(
  messages: MessageCenterItem[],
  filters: MessageCenterFilters = {},
  selectedId?: string,
): MessageCenterQueueView {
  const filteredMessages = filterMessageCenterItems(messages, filters)

  return {
    filteredMessages,
    selectedMessage:
      filteredMessages.find((message) => message.id === selectedId) ??
      filteredMessages[0],
  }
}

export function updateMessageCenterQueueItem(
  messages: MessageCenterItem[],
  id: string,
  {
    action,
    actor = '当前处理人',
    assignee,
    body = '',
    at = '刚刚',
  }: MessageCenterQueueUpdate,
): MessageCenterItem[] {
  return messages.map((message) => {
    if (message.id !== id) {
      return message
    }

    if (action === 'mark-read') {
      return {
        ...message,
        status: message.status === 'unread' ? 'open' : message.status,
        timeline: [
          ...message.timeline,
          { label: `${actor} 标记为处理中`, at },
        ],
      }
    }

    if (action === 'resolve') {
      return {
        ...message,
        status: 'resolved',
        timeline: [...message.timeline, { label: `${actor} 标记已解决`, at }],
      }
    }

    if (action === 'assign') {
      const nextAssignee = assignee?.trim() || message.assignee

      return {
        ...message,
        assignee: nextAssignee,
        status: message.status === 'resolved' ? 'resolved' : 'open',
        timeline: [
          ...message.timeline,
          { label: `${actor} 转交给 ${nextAssignee}`, at },
        ],
      }
    }

    const replyPreview = body.trim()
    const replyLabel =
      replyPreview.length > 0
        ? `${actor} 回复：${replyPreview.slice(0, 18)}${
            replyPreview.length > 18 ? '...' : ''
          }`
        : `${actor} 发送回复`

    return {
      ...message,
      status: message.status === 'resolved' ? 'resolved' : 'open',
      timeline: [...message.timeline, { label: replyLabel, at }],
    }
  })
}
