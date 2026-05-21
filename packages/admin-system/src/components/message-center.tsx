'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { cn } from '../lib/cn'
import {
  getMessageCenterAssignees,
  getMessageCenterQueueView,
  getMessageCenterOwners,
  getMessageCenterStatusCounts,
  updateMessageCenterQueueItem,
} from '../models/message-center'
import type {
  MessageCenterFilters,
  MessageCenterItem,
  MessageCenterMetric,
  MessageCenterQueueAction,
  MessageCenterReplyTemplate,
  MessagePriority,
  MessageStatus,
} from '../models/message-center'

export type {
  MessageCenterItem,
  MessageCenterMetric,
  MessageCenterQueueAction,
  MessageCenterReplyTemplate,
  MessageCenterTimelineItem,
  MessagePriority,
  MessageStatus,
} from '../models/message-center'

interface MessageCenterProps {
  metrics: MessageCenterMetric[]
  messages: MessageCenterItem[]
  replyTemplates: MessageCenterReplyTemplate[]
  scopeLabel: string
}

const statusLabels: Record<MessageStatus | 'all', string> = {
  all: '全部',
  unread: '未读',
  open: '处理中',
  resolved: '已解决',
}

const statusTone: Record<MessageStatus, string> = {
  unread: 'bg-primary text-primary-foreground',
  open: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
}

const priorityLabels: Record<MessagePriority, string> = {
  high: '高',
  normal: '中',
  low: '低',
}

const priorityFilterLabels: Record<MessagePriority | 'all', string> = {
  all: '全部优先级',
  high: '高优先级',
  normal: '中优先级',
  low: '低优先级',
}

const priorityTone: Record<MessagePriority, string> = {
  high: 'text-destructive',
  normal: 'text-foreground',
  low: 'text-muted-foreground',
}

export function MessageCenter({
  metrics,
  messages,
  replyTemplates,
  scopeLabel,
}: MessageCenterProps) {
  const [queueMessages, setQueueMessages] = useState(messages)
  const [status, setStatus] = useState<MessageStatus | 'all'>('all')
  const [priority, setPriority] = useState<MessagePriority | 'all'>('all')
  const [owner, setOwner] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>(
    messages[0]?.id,
  )
  const [draft, setDraft] = useState(messages[0]?.suggestedReply ?? '')
  const [handoffAssignee, setHandoffAssignee] = useState(
    messages[0]?.assignee ?? '',
  )
  const [activityMessage, setActivityMessage] = useState('草稿未发送')
  const filters = useMemo<MessageCenterFilters>(
    () => ({
      status,
      priority,
      owner,
      query,
    }),
    [owner, priority, query, status],
  )

  const statusCounts = useMemo(
    () => getMessageCenterStatusCounts(queueMessages),
    [queueMessages],
  )
  const ownerOptions = useMemo(
    () => getMessageCenterOwners(queueMessages),
    [queueMessages],
  )
  const assigneeOptions = useMemo(
    () => getMessageCenterAssignees(queueMessages),
    [queueMessages],
  )
  const { filteredMessages, selectedMessage } = useMemo(
    () => getMessageCenterQueueView(queueMessages, filters, selectedId),
    [filters, queueMessages, selectedId],
  )

  const selectMessage = (message: MessageCenterItem | undefined) => {
    setSelectedId(message?.id)
    setDraft(message?.suggestedReply ?? '')
    setHandoffAssignee(message?.assignee ?? '')
    setActivityMessage('草稿未发送')
  }

  const selectFirstMatchingMessage = (nextFilters: MessageCenterFilters) => {
    selectMessage(
      getMessageCenterQueueView(queueMessages, nextFilters).selectedMessage,
    )
  }

  const applyQueueAction = (
    action: MessageCenterQueueAction,
    message: MessageCenterItem,
  ) => {
    const nextMessages = updateMessageCenterQueueItem(
      queueMessages,
      message.id,
      {
        action,
        actor: message.assignee,
        assignee: handoffAssignee,
        body: draft,
      },
    )
    const visibleMessage = getMessageCenterQueueView(
      nextMessages,
      filters,
      message.id,
    ).selectedMessage

    setQueueMessages(nextMessages)
    setSelectedId(visibleMessage?.id)
    setDraft(visibleMessage?.suggestedReply ?? '')
    setHandoffAssignee(visibleMessage?.assignee ?? '')
    const nextActivityMessage =
      action === 'reply'
        ? '回复已记录到处理时间线'
        : action === 'resolve'
          ? '消息已标记解决'
          : action === 'assign'
            ? `消息已转交给 ${visibleMessage?.assignee ?? handoffAssignee}`
            : '消息已转入处理中'
    setActivityMessage(nextActivityMessage)
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <section
            key={metric.label}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metric.detail}
            </p>
          </section>
        ))}
      </div>

      <div className="grid min-h-[34rem] overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:grid-cols-[minmax(18rem,24rem)_1fr]">
        <section className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Inbox className="size-4 text-primary" />
              {scopeLabel}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(Object.keys(statusLabels) as Array<MessageStatus | 'all'>).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      'h-9 rounded-md border border-border px-3 text-sm transition hover:bg-accent',
                      status === item &&
                        'border-primary bg-primary/10 text-primary',
                    )}
                    onClick={() => {
                      setStatus(item)
                      selectFirstMatchingMessage({ ...filters, status: item })
                    }}
                  >
                    {statusLabels[item]} {statusCounts[item]}
                  </button>
                ),
              )}
            </div>

            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  selectFirstMatchingMessage({
                    ...filters,
                    query: event.target.value,
                  })
                }}
                placeholder="搜索标题、发送人或渠道"
              />
            </label>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <select
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={owner}
                onChange={(event) => {
                  setOwner(event.target.value)
                  selectFirstMatchingMessage({
                    ...filters,
                    owner: event.target.value,
                  })
                }}
              >
                <option value="all">全部小组</option>
                {ownerOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={priority}
                onChange={(event) => {
                  const nextPriority = event.target
                    .value as MessagePriority | 'all'
                  setPriority(nextPriority)
                  selectFirstMatchingMessage({
                    ...filters,
                    priority: nextPriority,
                  })
                }}
              >
                {(
                  Object.keys(priorityFilterLabels) as Array<
                    MessagePriority | 'all'
                  >
                ).map((item) => (
                  <option key={item} value={item}>
                    {priorityFilterLabels[item]}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              当前筛选 {filteredMessages.length} / {queueMessages.length} 条
            </p>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  className={cn(
                    'flex w-full gap-3 border-b border-border p-4 text-left transition hover:bg-accent/70',
                    selectedMessage?.id === message.id && 'bg-accent',
                  )}
                  onClick={() => selectMessage(message)}
                >
                  <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <MessageSquare className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {message.title}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          priorityTone[message.priority],
                        )}
                      >
                        P{priorityLabels[message.priority]}
                      </span>
                    </span>
                    <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {message.body}
                    </span>
                    <span className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{message.sender}</span>
                      <span>{message.receivedAt}</span>
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="grid min-h-56 place-items-center p-6 text-center text-sm text-muted-foreground">
                没有匹配的消息
              </div>
            )}
          </div>
        </section>

        {selectedMessage ? (
          <section className="flex min-w-0 flex-col">
            <div className="border-b border-border p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    statusTone[selectedMessage.status],
                  )}
                >
                  {statusLabels[selectedMessage.status]}
                </span>
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {selectedMessage.sourceLabel}
                </span>
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {selectedMessage.audience}
                </span>
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {selectedMessage.channel}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">
                {selectedMessage.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {selectedMessage.body}
              </p>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              <MessageFact
                icon={<UserRound className="size-4" />}
                label="负责人"
                value={`${selectedMessage.owner} · ${selectedMessage.assignee}`}
              />
              <MessageFact
                icon={<Clock3 className="size-4" />}
                label="SLA"
                value={selectedMessage.slaLabel}
              />
              <MessageFact
                icon={<AlertCircle className="size-4" />}
                label="优先级"
                value={`${priorityLabels[selectedMessage.priority]}优先级`}
              />
            </div>

            <div className="grid gap-4 px-5 md:grid-cols-[1fr_minmax(16rem,20rem)]">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      下一步
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {selectedMessage.nextStep}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">
                  处理记录
                </p>
                <div className="mt-3 space-y-3">
                  {selectedMessage.timeline.map((item) => (
                    <div key={`${item.label}-${item.at}`} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.at}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3 border-t border-border p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Sparkles className="size-4 text-primary" />
                  快捷回复
                </span>
                {replyTemplates.map((template) => (
                  <button
                    key={template.label}
                    type="button"
                    className="h-8 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:bg-accent"
                    onClick={() => setDraft(template.body)}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
              <textarea
                className="min-h-24 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="输入给对方的回复内容"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {activityMessage}
                </p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground">
                    <UserRound className="size-4 text-muted-foreground" />
                    <select
                      className="h-full bg-transparent text-sm outline-none"
                      value={handoffAssignee}
                      onChange={(event) =>
                        setHandoffAssignee(event.target.value)
                      }
                    >
                      {assigneeOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      selectedMessage.status === 'resolved' ||
                      handoffAssignee === selectedMessage.assignee
                    }
                    onClick={() => applyQueueAction('assign', selectedMessage)}
                  >
                    转交
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedMessage.status !== 'unread'}
                    onClick={() => applyQueueAction('mark-read', selectedMessage)}
                  >
                    标记已读
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    onClick={() => applyQueueAction('reply', selectedMessage)}
                  >
                    <Send className="size-4" />
                    回复
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedMessage.status === 'resolved'}
                    onClick={() => applyQueueAction('resolve', selectedMessage)}
                  >
                    解决
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid min-h-80 place-items-center p-8 text-sm text-muted-foreground">
            暂无消息
          </div>
        )}
      </div>
    </div>
  )
}

function MessageFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  )
}
