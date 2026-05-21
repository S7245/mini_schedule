'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  MessageSquare,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { cn } from '../lib/cn'

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
  slaLabel: string
  nextStep: string
  suggestedReply: string
  timeline: MessageCenterTimelineItem[]
}

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
  const [status, setStatus] = useState<MessageStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | undefined>(
    messages[0]?.id,
  )
  const [draft, setDraft] = useState(messages[0]?.suggestedReply ?? '')

  const filteredMessages = useMemo(
    () =>
      messages.filter(
        (message) => status === 'all' || message.status === status,
      ),
    [messages, status],
  )

  const selectedMessage =
    filteredMessages.find((message) => message.id === selectedId) ??
    filteredMessages[0] ??
    messages[0]

  const selectMessage = (message: MessageCenterItem | undefined) => {
    setSelectedId(message?.id)
    setDraft(message?.suggestedReply ?? '')
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
                      const next = messages.find(
                        (message) => item === 'all' || message.status === item,
                      )
                      selectMessage(next)
                    }}
                  >
                    {statusLabels[item]}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {filteredMessages.map((message) => (
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
            ))}
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
                value={selectedMessage.owner}
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
                  草稿未发送
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-accent"
                  >
                    标记已读
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    <Send className="size-4" />
                    回复
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
