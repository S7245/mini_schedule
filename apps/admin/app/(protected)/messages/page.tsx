import { MessageCenter } from '@mini-schedule/admin-system/components/message-center'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import type {
  MessageCenterItem,
  MessageCenterMetric,
} from '@mini-schedule/admin-system/components/message-center'

const metrics: MessageCenterMetric[] = [
  { label: '未读消息', value: '4', detail: '需要平台运营在今日处理' },
  { label: '平均响应', value: '18m', detail: '基于当前人工客服目标值' },
  { label: '已解决', value: '12', detail: '本周消息闭环样例' },
]

const messages: MessageCenterItem[] = [
  {
    id: 'msg-brand-audit',
    title: '新品牌入驻资料待复核',
    body: '青岚普拉提提交了营业资料和联系人信息，请确认品牌名称、手机号和 logo 是否符合平台准入要求。',
    sender: '青岚普拉提',
    sourceLabel: '品牌入驻',
    receivedAt: '09:42',
    status: 'unread',
    priority: 'high',
    audience: '平台运营',
    owner: '运营组',
    nextStep:
      '进入品牌详情页核对资料，确认无误后将品牌状态从 pending 调整为 active。',
  },
  {
    id: 'msg-password-reset',
    title: '品牌管理员请求重置登录密码',
    body: '北岸健身的门店管理员无法完成手机密码登录，需要平台侧确认身份后协助重置。',
    sender: '北岸健身',
    sourceLabel: '账号支持',
    receivedAt: '10:16',
    status: 'open',
    priority: 'normal',
    audience: '客服支持',
    owner: '客服组',
    nextStep:
      '联系品牌联系人核验手机号，完成后在管理员管理中创建临时密码并通知对方更新。',
  },
  {
    id: 'msg-training-export',
    title: '训练记录导出字段咨询',
    body: '品牌希望导出学员训练记录时带上课程难度和训练时长，当前后台列表只能在线查看。',
    sender: '云阶瑜伽',
    sourceLabel: '功能咨询',
    receivedAt: '11:05',
    status: 'unread',
    priority: 'low',
    audience: '产品运营',
    owner: '产品组',
    nextStep:
      '记录到后台报表需求池，回复当前版本暂不支持导出，并提供训练记录页筛选替代方案。',
  },
  {
    id: 'msg-course-review',
    title: '课程封面加载异常反馈',
    body: '品牌反馈课程详情页中部分远程封面无法显示，需要确认 URL 格式和对象存储访问权限。',
    sender: 'Loop Studio',
    sourceLabel: '内容管理',
    receivedAt: '昨天',
    status: 'unread',
    priority: 'normal',
    audience: '平台运营',
    owner: '内容组',
    nextStep:
      '抽查课程详情页的 cover_url，若 URL 可访问则继续排查前端图片域名配置。',
  },
  {
    id: 'msg-invoice',
    title: '品牌订阅发票信息已归档',
    body: '本月品牌服务费发票抬头和税号已完成归档，后续可在财务工作台接入后同步展示。',
    sender: '财务助手',
    sourceLabel: '系统通知',
    receivedAt: '周一',
    status: 'resolved',
    priority: 'low',
    audience: '平台运营',
    owner: '财务组',
    nextStep: '无需人工处理，等待后续财务模块接入真实发票数据。',
  },
]

export default function MessagesPage() {
  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="消息中心"
        description="集中处理品牌入驻、账号支持、内容反馈和系统通知。当前为前端工作台样例数据，后续可替换为真实消息接口。"
      />
      <MessageCenter
        metrics={metrics}
        messages={messages}
        scopeLabel="平台消息队列"
      />
    </div>
  )
}
