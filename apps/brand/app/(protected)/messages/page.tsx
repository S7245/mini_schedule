import { MessageCenter } from '@mini-schedule/admin-system/components/message-center'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import type {
  MessageCenterItem,
  MessageCenterMetric,
  MessageCenterReplyTemplate,
} from '@mini-schedule/admin-system/components/message-center'

const metrics: MessageCenterMetric[] = [
  { label: '未读消息', value: '3', detail: '来自学员、课程和系统提醒' },
  { label: '待回复', value: '2', detail: '建议在当日运营时段内处理' },
  { label: '已闭环', value: '8', detail: '本周品牌侧处理样例' },
]

const replyTemplates: MessageCenterReplyTemplate[] = [
  {
    label: '安排跟进',
    body: '您好，我们已收到你的咨询，会结合近期训练记录安排教练跟进，并在今日训练时段内回复建议。',
  },
  {
    label: '需要补充',
    body: '您好，为了更准确处理该事项，请补充课程名称、期望训练时间以及相关截图。',
  },
  {
    label: '处理完成',
    body: '您好，该事项已处理完成。请刷新页面确认，如仍有异常可以继续在此消息中反馈。',
  },
]

const messages: MessageCenterItem[] = [
  {
    id: 'brand-msg-user',
    title: '学员咨询课程适配',
    body: '学员张敏询问是否可以将入门力量课程调整为低冲击版本，并希望获得下周训练建议。',
    sender: '张敏',
    sourceLabel: '学员咨询',
    receivedAt: '08:58',
    channel: '学员端',
    status: 'unread',
    priority: 'normal',
    audience: '品牌教练',
    owner: '教练组',
    assignee: '陈教练',
    slaLabel: '今日内',
    nextStep: '查看学员近期训练记录，确认课程难度后回复可替代课程和训练频次。',
    suggestedReply:
      '你好，我们会先查看你近期的训练记录，再给出低冲击替代课程和下周训练频次建议。',
    timeline: [
      { label: '学员提交课程适配咨询', at: '08:58' },
      { label: '系统分配给品牌教练', at: '08:59' },
    ],
  },
  {
    id: 'brand-msg-course',
    title: '课程封面需要补充',
    body: '核心稳定进阶课程尚未配置封面图，学员端课程列表会显示默认占位。',
    sender: '内容检查',
    sourceLabel: '系统通知',
    receivedAt: '10:21',
    channel: '系统检查',
    status: 'unread',
    priority: 'low',
    audience: '内容运营',
    owner: '课程运营',
    assignee: '许宁',
    slaLabel: '2 个工作日',
    nextStep: '进入课程详情页补充 cover_url，确认图片可公开访问后保存。',
    suggestedReply:
      '该提醒来自系统检查，无需回复。请进入课程详情页补充封面图并确认图片可以公开访问。',
    timeline: [
      { label: '系统发现课程封面缺失', at: '10:21' },
      { label: '等待课程运营补充', at: '10:22' },
    ],
  },
  {
    id: 'brand-msg-training',
    title: '训练记录连续缺失提醒',
    body: '有 6 名活跃学员近 7 天没有新增训练记录，可能需要跟进打卡或训练计划安排。',
    sender: '训练监控',
    sourceLabel: '运营提醒',
    receivedAt: '昨天',
    channel: '运营监控',
    status: 'open',
    priority: 'high',
    audience: '品牌运营',
    owner: '运营组',
    assignee: '刘可',
    slaLabel: '今日内',
    nextStep: '筛选训练记录列表，联系缺失记录学员确认训练状态并补齐必要记录。',
    suggestedReply:
      '我们已看到连续缺失提醒，会筛选近 7 天训练记录并联系相关学员确认训练状态。',
    timeline: [
      { label: '监控发现训练记录缺失', at: '昨天 18:00' },
      { label: '运营组开始跟进', at: '今天 09:20' },
    ],
  },
  {
    id: 'brand-msg-profile',
    title: '品牌资料同步完成',
    body: '品牌联系人和基础资料已同步到平台后台，平台运营可在品牌详情页查看。',
    sender: '平台系统',
    sourceLabel: '系统通知',
    receivedAt: '周一',
    channel: '平台同步',
    status: 'resolved',
    priority: 'low',
    audience: '品牌管理员',
    owner: '系统',
    assignee: '系统',
    slaLabel: '无需处理',
    nextStep: '无需人工处理，如联系人信息变化再联系平台运营更新。',
    suggestedReply:
      '本条为平台同步通知，无需回复。如品牌联系人信息变化，请联系平台运营更新。',
    timeline: [
      { label: '平台同步品牌资料', at: '周一 11:12' },
      { label: '系统自动关闭通知', at: '周一 11:13' },
    ],
  },
]

export default function BrandMessagesPage() {
  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="消息中心"
        description="集中处理学员咨询、课程提醒和训练运营事项，保持品牌运营响应节奏。"
      />
      <MessageCenter
        metrics={metrics}
        messages={messages}
        replyTemplates={replyTemplates}
        scopeLabel="品牌消息队列"
      />
    </div>
  )
}
