import assert from 'node:assert/strict'
import test from 'node:test'

import {
  filterMessageCenterItems,
  getMessageCenterOwners,
  getMessageCenterStatusCounts,
  updateMessageCenterQueueItem,
  type MessageCenterItem,
} from '../src/models/message-center'

const messages: MessageCenterItem[] = [
  {
    id: 'brand-audit',
    title: '品牌入驻资料待复核',
    body: '请确认联系人手机号和营业资料。',
    sender: '青岚普拉提',
    sourceLabel: '品牌入驻',
    receivedAt: '09:42',
    channel: '后台工单',
    status: 'unread',
    priority: 'high',
    audience: '平台运营',
    owner: '运营组',
    assignee: '林晨',
    slaLabel: '2 小时内',
    nextStep: '核对资料并更新品牌状态。',
    suggestedReply: '我们会尽快复核。',
    timeline: [{ label: '品牌提交资料', at: '09:42' }],
  },
  {
    id: 'course-cover',
    title: '课程封面加载异常反馈',
    body: '部分远程封面无法显示。',
    sender: 'Loop Studio',
    sourceLabel: '内容管理',
    receivedAt: '昨天',
    channel: '异常反馈',
    status: 'open',
    priority: 'normal',
    audience: '平台运营',
    owner: '内容组',
    assignee: '唐雨',
    slaLabel: '今日内',
    nextStep: '抽查 cover_url。',
    suggestedReply: '我们会核对封面地址。',
    timeline: [{ label: '品牌反馈异常', at: '昨天 16:28' }],
  },
  {
    id: 'invoice',
    title: '品牌订阅发票信息已归档',
    body: '发票抬头和税号已完成归档。',
    sender: '财务助手',
    sourceLabel: '系统通知',
    receivedAt: '周一',
    channel: '系统推送',
    status: 'resolved',
    priority: 'low',
    audience: '平台运营',
    owner: '财务组',
    assignee: '系统',
    slaLabel: '无需处理',
    nextStep: '无需人工处理。',
    suggestedReply: '无需回复。',
    timeline: [{ label: '系统自动关闭通知', at: '周一 14:11' }],
  },
]

test('message center counts messages by queue status', () => {
  assert.deepEqual(getMessageCenterStatusCounts(messages), {
    all: 3,
    unread: 1,
    open: 1,
    resolved: 1,
  })
})

test('message center exposes stable owner filters', () => {
  assert.deepEqual(getMessageCenterOwners(messages), [
    '运营组',
    '内容组',
    '财务组',
  ])
})

test('message center filters by status priority owner and query', () => {
  const filtered = filterMessageCenterItems(messages, {
    status: 'open',
    priority: 'normal',
    owner: '内容组',
    query: '封面',
  })

  assert.equal(filtered.length, 1)
  assert.equal(filtered[0]?.id, 'course-cover')
})

test('message center query searches sender and assignee fields', () => {
  assert.equal(filterMessageCenterItems(messages, { query: '青岚' }).length, 1)
  assert.equal(filterMessageCenterItems(messages, { query: '唐雨' }).length, 1)
})

test('message center can move unread messages into the open queue', () => {
  const updated = updateMessageCenterQueueItem(messages, 'brand-audit', {
    action: 'mark-read',
    actor: '林晨',
    at: '刚刚',
  })

  assert.equal(updated[0]?.status, 'open')
  assert.equal(updated[0]?.timeline.at(-1)?.label, '林晨 标记为处理中')
})

test('message center records replies without reopening resolved messages', () => {
  const updated = updateMessageCenterQueueItem(messages, 'invoice', {
    action: 'reply',
    actor: '系统',
    body: '无需回复。',
  })

  assert.equal(updated[2]?.status, 'resolved')
  assert.equal(/系统 回复/.test(updated[2]?.timeline.at(-1)?.label ?? ''), true)
})

test('message center can resolve open messages', () => {
  const updated = updateMessageCenterQueueItem(messages, 'course-cover', {
    action: 'resolve',
    actor: '唐雨',
  })

  assert.equal(updated[1]?.status, 'resolved')
  assert.equal(updated[1]?.timeline.at(-1)?.label, '唐雨 标记已解决')
})
