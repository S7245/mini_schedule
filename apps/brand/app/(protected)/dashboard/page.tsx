'use client'

import Link from 'next/link'
import { ArrowUpRight, Inbox } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { brandMessagePreview, brandMessageSummary } from '@/lib/message-center-data'
import type { MessageCenterItem } from '@mini-schedule/admin-system/models/message-center'

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">概览</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">学员总数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">待接入</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">课程总数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">待接入</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">未读消息</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{brandMessageSummary.unread}</p>
              <p className="text-xs text-muted-foreground mt-1">来自学员、课程和系统提醒</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>待处理消息</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  把学员咨询和训练提醒拉回首页，方便品牌管理员直接进入消息中心。
                </p>
              </div>
              <Link
                href="/messages"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                查看全部
                <ArrowUpRight className="size-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {brandMessagePreview.map((message: MessageCenterItem) => (
                <div
                  key={message.id}
                  className="rounded-md border border-border bg-background px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{message.title}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {message.sender} · {message.sourceLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {message.status === 'resolved' ? '已解决' : '待处理'}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Inbox className="size-4 text-primary" />
                消息节奏
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>待回复</span>
                <span className="font-medium text-foreground">
                  {brandMessageSummary.active}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>高优先级</span>
                <span className="font-medium text-foreground">
                  {brandMessageSummary.highPriority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>已安排跟进</span>
                <span className="font-medium text-foreground">
                  {brandMessageSummary.scheduled}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
