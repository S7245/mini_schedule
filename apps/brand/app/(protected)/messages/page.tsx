import { MessageCenter } from '@mini-schedule/admin-system/components/message-center'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import {
  brandMessageMetrics,
  brandMessages,
  brandMessageReplyTemplates,
} from '@/lib/message-center-data'

export default function BrandMessagesPage() {
  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="消息中心"
        description="集中处理学员咨询、课程提醒和训练运营事项，保持品牌运营响应节奏。"
      />
      <MessageCenter
        metrics={brandMessageMetrics}
        messages={brandMessages}
        replyTemplates={brandMessageReplyTemplates}
        scopeLabel="品牌消息队列"
      />
    </div>
  )
}
