import { MessageCenter } from '@mini-schedule/admin-system/components/message-center'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import type {
  MessageCenterItem,
  MessageCenterMetric,
} from '@mini-schedule/admin-system/components/message-center'

const metrics: MessageCenterMetric[] = [
  { label: '未读消息', value: '3', detail: '来自学员、课程和系统提醒' },
  { label: '待回复', value: '2', detail: '建议在当日运营时段内处理' },
  { label: '已闭环', value: '8', detail: '本周品牌侧处理样例' },
]

const messages: MessageCenterItem[] = [
  {
    id: 'brand-msg-user',
    title: '学员咨询课程适配',
    body: '学员张敏询问是否可以将入门力量课程调整为低冲击版本，并希望获得下周训练建议。',
    sender: '张敏',
    sourceLabel: '学员咨询',
    receivedAt: '08:58',
    status: 'unread',
    priority: 'normal',
    audience: '品牌教练',
    owner: '教练组',
    nextStep: '查看学员近期训练记录，确认课程难度后回复可替代课程和训练频次。',
  },
  {
    id: 'brand-msg-course',
    title: '课程封面需要补充',
    body: '核心稳定进阶课程尚未配置封面图，学员端课程列表会显示默认占位。',
    sender: '内容检查',
    sourceLabel: '系统通知',
    receivedAt: '10:21',
    status: 'unread',
    priority: 'low',
    audience: '内容运营',
    owner: '课程运营',
    nextStep: '进入课程详情页补充 cover_url，确认图片可公开访问后保存。',
  },
  {
    id: 'brand-msg-training',
    title: '训练记录连续缺失提醒',
    body: '有 6 名活跃学员近 7 天没有新增训练记录，可能需要跟进打卡或训练计划安排。',
    sender: '训练监控',
    sourceLabel: '运营提醒',
    receivedAt: '昨天',
    status: 'open',
    priority: 'high',
    audience: '品牌运营',
    owner: '运营组',
    nextStep: '筛选训练记录列表，联系缺失记录学员确认训练状态并补齐必要记录。',
  },
  {
    id: 'brand-msg-profile',
    title: '品牌资料同步完成',
    body: '品牌联系人和基础资料已同步到平台后台，平台运营可在品牌详情页查看。',
    sender: '平台系统',
    sourceLabel: '系统通知',
    receivedAt: '周一',
    status: 'resolved',
    priority: 'low',
    audience: '品牌管理员',
    owner: '系统',
    nextStep: '无需人工处理，如联系人信息变化再联系平台运营更新。',
  },
]

export default function BrandMessagesPage() {
  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="消息中心"
        description="集中处理学员咨询、课程提醒和训练运营事项。当前为品牌后台样例数据，后续接入真实消息接口。"
      />
      <MessageCenter
        metrics={metrics}
        messages={messages}
        scopeLabel="品牌消息队列"
      />
    </div>
  )
}
