import { BellRing, Sparkles } from 'lucide-react'
import { MessageCenter } from '@mini-schedule/admin-system/components/message-center'
import { FilterBar } from '@mini-schedule/admin-system/components/filter-bar'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import {
  adminMessageMetrics,
  adminMessages,
  adminMessageReplyTemplates,
} from '@/lib/message-center-data'

export default function MessagesPage() {
  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="消息中心"
        description="集中处理品牌入驻、账号支持、内容反馈和系统通知，按优先级推进运营响应。"
      />
      <FilterBar>
        <div>
          <p className="text-sm font-medium text-foreground">当前队列包含 {adminMessages.length} 条运营消息。</p>
          <p className="text-xs text-muted-foreground">优先关注入驻审核、内容异常与高优先级支持请求。</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            <BellRing className="size-4 text-primary" />
            未读 {adminMessageMetrics[0]?.value ?? '--'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            高优 {adminMessageMetrics[1]?.value ?? '--'}
          </span>
        </div>
      </FilterBar>
      <MessageCenter
        metrics={adminMessageMetrics}
        messages={adminMessages}
        replyTemplates={adminMessageReplyTemplates}
        scopeLabel="平台消息队列"
      />
    </div>
  )
}
