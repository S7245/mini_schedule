import { MessageCenter } from '@mini-schedule/admin-system/components/message-center'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import type {
  MessageCenterItem,
  MessageCenterMetric,
  MessageCenterReplyTemplate,
} from '@mini-schedule/admin-system/components/message-center'

const metrics: MessageCenterMetric[] = [
  { label: '未读消息', value: '4', detail: '需要平台运营在今日处理' },
  { label: '平均响应', value: '18m', detail: '基于当前人工客服目标值' },
  { label: '已解决', value: '12', detail: '本周消息闭环样例' },
]

const replyTemplates: MessageCenterReplyTemplate[] = [
  {
    label: '确认处理中',
    body: '您好，平台运营已收到该事项，我们会先核对相关资料，并在今日运营时段内同步处理结果。',
  },
  {
    label: '补充信息',
    body: '您好，为了继续处理该事项，请补充品牌名称、联系人手机号以及相关页面截图，便于我们快速定位。',
  },
  {
    label: '已闭环',
    body: '您好，该事项已处理完成。如后续仍有异常，请在同一消息线程中继续补充说明。',
  },
]

const messages: MessageCenterItem[] = [
  {
    id: 'msg-brand-audit',
    title: '新品牌入驻资料待复核',
    body: '青岚普拉提提交了营业资料和联系人信息，请确认品牌名称、手机号和 logo 是否符合平台准入要求。',
    sender: '青岚普拉提',
    sourceLabel: '品牌入驻',
    receivedAt: '09:42',
    channel: '后台工单',
    status: 'unread',
    priority: 'high',
    audience: '平台运营',
    owner: '运营组',
    assignee: '林晨',
    labels: ['入驻审核', '资料复核'],
    internalNotes: [
      '先核对营业执照主体和联系人手机号，再决定是否转交客服补充资料。',
    ],
    slaLabel: '2 小时内',
    nextStep:
      '进入品牌详情页核对资料，确认无误后将品牌状态从 pending 调整为 active。',
    suggestedReply:
      '您好，入驻资料已进入平台复核队列。我们会先核对营业资料、联系人信息和品牌 logo，完成后同步审核结果。',
    timeline: [
      { label: '品牌提交入驻资料', at: '09:42' },
      { label: '系统标记为高优先级', at: '09:43' },
    ],
  },
  {
    id: 'msg-password-reset',
    title: '品牌管理员请求重置登录密码',
    body: '北岸健身的门店管理员无法完成手机密码登录，需要平台侧确认身份后协助重置。',
    sender: '北岸健身',
    sourceLabel: '账号支持',
    receivedAt: '10:16',
    channel: '客服转交',
    status: 'open',
    priority: 'normal',
    audience: '客服支持',
    owner: '客服组',
    assignee: '周然',
    labels: ['账号支持', '身份核验'],
    internalNotes: [
      '不要直接发送临时密码，先确认品牌联系人和管理员手机号一致。',
    ],
    slaLabel: '今日内',
    nextStep:
      '联系品牌联系人核验手机号，完成后在管理员管理中创建临时密码并通知对方更新。',
    suggestedReply:
      '您好，密码重置需要先核验品牌联系人手机号。请确认当前可接收验证码的管理员手机号，我们核验后会协助重置。',
    timeline: [
      { label: '客服登记账号问题', at: '10:16' },
      { label: '已分配给客服组', at: '10:18' },
    ],
  },
  {
    id: 'msg-training-export',
    title: '训练记录导出字段咨询',
    body: '品牌希望导出学员训练记录时带上课程难度和训练时长，当前后台列表只能在线查看。',
    sender: '云阶瑜伽',
    sourceLabel: '功能咨询',
    receivedAt: '11:05',
    channel: '品牌反馈',
    status: 'unread',
    priority: 'low',
    audience: '产品运营',
    owner: '产品组',
    assignee: '何知',
    labels: ['功能咨询', '报表需求'],
    internalNotes: [
      '归档到报表需求池，避免承诺具体导出上线时间。',
    ],
    slaLabel: '2 个工作日',
    nextStep:
      '记录到后台报表需求池，回复当前版本暂不支持导出，并提供训练记录页筛选替代方案。',
    suggestedReply:
      '您好，当前版本暂不支持按课程难度和训练时长导出。我们会记录到报表需求池，短期可先通过训练记录筛选完成核对。',
    timeline: [
      { label: '品牌提交导出咨询', at: '11:05' },
      { label: '等待产品运营归档', at: '11:06' },
    ],
  },
  {
    id: 'msg-course-review',
    title: '课程封面加载异常反馈',
    body: '品牌反馈课程详情页中部分远程封面无法显示，需要确认 URL 格式和对象存储访问权限。',
    sender: 'Loop Studio',
    sourceLabel: '内容管理',
    receivedAt: '昨天',
    channel: '异常反馈',
    status: 'unread',
    priority: 'normal',
    audience: '平台运营',
    owner: '内容组',
    assignee: '唐雨',
    labels: ['内容异常', '图片资源'],
    internalNotes: [
      '先抽查 cover_url 是否可公网访问，再判断是否需要前端图片域名配置。',
    ],
    slaLabel: '今日内',
    nextStep:
      '抽查课程详情页的 cover_url，若 URL 可访问则继续排查前端图片域名配置。',
    suggestedReply:
      '您好，我们会抽查课程封面地址和对象存储访问权限。若需要品牌侧配合，会在此线程补充具体课程名称。',
    timeline: [
      { label: '品牌反馈封面异常', at: '昨天 16:28' },
      { label: '系统归类到内容管理', at: '昨天 16:29' },
    ],
  },
  {
    id: 'msg-invoice',
    title: '品牌订阅发票信息已归档',
    body: '本月品牌服务费发票抬头和税号已完成归档，后续可在财务工作台接入后同步展示。',
    sender: '财务助手',
    sourceLabel: '系统通知',
    receivedAt: '周一',
    channel: '系统推送',
    status: 'resolved',
    priority: 'low',
    audience: '平台运营',
    owner: '财务组',
    assignee: '系统',
    labels: ['系统通知', '财务归档'],
    internalNotes: [
      '系统自动归档通知，当前不需要人工客服跟进。',
    ],
    slaLabel: '无需处理',
    nextStep: '无需人工处理，等待后续财务模块接入真实发票数据。',
    suggestedReply:
      '本条为系统通知，无需回复。后续财务模块接入后可在发票详情中查看归档记录。',
    timeline: [
      { label: '发票信息归档完成', at: '周一 14:10' },
      { label: '系统自动关闭通知', at: '周一 14:11' },
    ],
  },
]

export default function MessagesPage() {
  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="消息中心"
        description="集中处理品牌入驻、账号支持、内容反馈和系统通知，按优先级推进运营响应。"
      />
      <MessageCenter
        metrics={metrics}
        messages={messages}
        replyTemplates={replyTemplates}
        scopeLabel="平台消息队列"
      />
    </div>
  )
}
