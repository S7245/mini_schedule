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

export interface MessageCenterFollowUpOption {
  label: string
  value: string
}

export interface MessageCenterTimelineItem {
  label: string
  at: string
}

export interface MessageCenterRelatedRecord {
  label: string
  value: string
  href: string
  kind: string
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
  labels: string[]
  internalNotes: string[]
  followUpAt: string
  relatedRecords: MessageCenterRelatedRecord[]
  slaLabel: string
  nextStep: string
  suggestedReply: string
  timeline: MessageCenterTimelineItem[]
}

export interface MessageCenterFilters {
  status?: MessageStatus | 'all'
  priority?: MessagePriority | 'all'
  owner?: string
  label?: string
  followUp?: 'all' | 'scheduled' | 'unscheduled'
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
  | 'label'
  | 'note'
  | 'schedule-follow-up'

export interface MessageCenterQueueUpdate {
  action: MessageCenterQueueAction
  actor?: string
  assignee?: string
  label?: string
  note?: string
  followUpAt?: string
  body?: string
  at?: string
}

export interface MessageCenterQueueActionResult {
  messages: MessageCenterItem[]
  view: MessageCenterQueueView
  draft: string
  handoffAssignee: string
  triageLabel: string
  internalNote: string
  followUpAt: string
  activityMessage: string
}

export interface MessageCenterComposerState {
  draft: string
  handoffAssignee: string
  triageLabel: string
  internalNote: string
  followUpAt: string
  activityMessage: string
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

export function getMessageCenterOwners(
  messages: MessageCenterItem[],
): string[] {
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

export function getMessageCenterLabels(
  messages: MessageCenterItem[],
): string[] {
  return Array.from(new Set(messages.flatMap((message) => message.labels)))
}

export function getMessageCenterFollowUpOptions(
  messages: MessageCenterItem[],
): string[] {
  return Array.from(
    new Set(messages.map((message) => message.followUpAt).filter(Boolean)),
  )
}

export function getMessageCenterScheduleOptions(
  messages: MessageCenterItem[],
  defaultOptions: MessageCenterFollowUpOption[],
): MessageCenterFollowUpOption[] {
  return Array.from(
    new Map(
      [
        ...defaultOptions,
        ...getMessageCenterFollowUpOptions(messages).map((value) => ({
          label: value,
          value,
        })),
      ].map((option) => [option.value, option]),
    ).values(),
  )
}

export function filterMessageCenterItems(
  messages: MessageCenterItem[],
  {
    status = 'all',
    priority = 'all',
    owner = 'all',
    label = 'all',
    followUp = 'all',
    query = '',
  }: MessageCenterFilters = {},
): MessageCenterItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  return messages.filter((message) => {
    const matchesStatus = status === 'all' || message.status === status
    const matchesPriority = priority === 'all' || message.priority === priority
    const matchesOwner = owner === 'all' || message.owner === owner
    const matchesLabel = label === 'all' || message.labels.includes(label)
    const matchesFollowUp =
      followUp === 'all' ||
      (followUp === 'scheduled' && message.followUpAt.length > 0) ||
      (followUp === 'unscheduled' && message.followUpAt.length === 0)
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
        message.followUpAt,
        message.nextStep,
        ...message.internalNotes,
        ...message.labels,
        ...message.relatedRecords.flatMap((record) => [
          record.label,
          record.value,
          record.kind,
        ]),
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedQuery)

    return (
      matchesStatus &&
      matchesPriority &&
      matchesOwner &&
      matchesLabel &&
      matchesFollowUp &&
      matchesQuery
    )
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

export function getMessageCenterComposerState(
  selectedMessage: MessageCenterItem | undefined,
  labelOptions: string[],
  activityMessage = '草稿未发送',
): MessageCenterComposerState {
  return {
    draft: selectedMessage?.suggestedReply ?? '',
    handoffAssignee: selectedMessage?.assignee ?? '',
    triageLabel: selectedMessage?.labels[0] ?? labelOptions[0] ?? '',
    internalNote: '',
    followUpAt: selectedMessage?.followUpAt ?? '',
    activityMessage,
  }
}

export function updateMessageCenterQueueItem(
  messages: MessageCenterItem[],
  id: string,
  {
    action,
    actor = '当前处理人',
    assignee,
    label,
    note,
    followUpAt,
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
        timeline: [...message.timeline, { label: `${actor} 标记为处理中`, at }],
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

    if (action === 'label') {
      const nextLabel = label?.trim()

      if (!nextLabel || message.labels.includes(nextLabel)) {
        return message
      }

      return {
        ...message,
        labels: [...message.labels, nextLabel],
        status: message.status === 'resolved' ? 'resolved' : 'open',
        timeline: [
          ...message.timeline,
          { label: `${actor} 添加标签 ${nextLabel}`, at },
        ],
      }
    }

    if (action === 'note') {
      const nextNote = note?.trim()

      if (!nextNote) {
        return message
      }

      return {
        ...message,
        internalNotes: [...message.internalNotes, nextNote],
        status: message.status === 'resolved' ? 'resolved' : 'open',
        timeline: [...message.timeline, { label: `${actor} 添加内部备注`, at }],
      }
    }

    if (action === 'schedule-follow-up') {
      const nextFollowUpAt = followUpAt?.trim()

      if (!nextFollowUpAt || nextFollowUpAt === message.followUpAt) {
        return message
      }

      return {
        ...message,
        followUpAt: nextFollowUpAt,
        status: message.status === 'resolved' ? 'resolved' : 'open',
        timeline: [
          ...message.timeline,
          { label: `${actor} 安排 ${nextFollowUpAt} 跟进`, at },
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

export function applyMessageCenterQueueAction(
  messages: MessageCenterItem[],
  selectedId: string,
  filters: MessageCenterFilters,
  update: MessageCenterQueueUpdate,
): MessageCenterQueueActionResult {
  const nextMessages = updateMessageCenterQueueItem(
    messages,
    selectedId,
    update,
  )
  const view = getMessageCenterQueueView(nextMessages, filters, selectedId)
  const composerState = getMessageCenterComposerState(
    view.selectedMessage,
    getMessageCenterLabels(nextMessages),
    getMessageCenterActivityMessage(
      update.action,
      nextMessages.find((message) => message.id === selectedId),
      update.label,
      update.note,
      update.followUpAt,
    ),
  )

  return {
    messages: nextMessages,
    view,
    ...composerState,
  }
}

function getMessageCenterActivityMessage(
  action: MessageCenterQueueAction,
  updatedMessage: MessageCenterItem | undefined,
  label?: string,
  note?: string,
  followUpAt?: string,
): string {
  if (action === 'reply') {
    return '回复已记录到处理时间线'
  }

  if (action === 'resolve') {
    return '消息已标记解决'
  }

  if (action === 'assign') {
    return `消息已转交给 ${updatedMessage?.assignee ?? ''}`
  }

  if (action === 'label') {
    return label ? `已添加标签 ${label}` : '标签未变更'
  }

  if (action === 'note') {
    return note?.trim() ? '内部备注已记录' : '备注未变更'
  }

  if (action === 'schedule-follow-up') {
    return followUpAt?.trim() ? `已安排 ${followUpAt} 跟进` : '跟进时间未变更'
  }

  return '消息已转入处理中'
}
