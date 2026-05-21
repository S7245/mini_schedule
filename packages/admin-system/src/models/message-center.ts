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

export type MessageCenterStatusCounts = Record<MessageStatus | 'all', number>

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
