import { Building2, CreditCard, FileClock, Inbox, LayoutDashboard, Package, Shield, WalletCards } from 'lucide-react'
import type { BackofficeNavItem } from '@mini-schedule/admin-system'
import { adminMessageSummary } from '@/lib/message-center-data'

export const adminNavItems: BackofficeNavItem[] = [
  {
    href: '/dashboard',
    label: '概览',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: '/brands',
    label: '品牌管理',
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    href: '/saas-plans',
    label: '套餐管理',
    icon: <Package className="h-4 w-4" />,
  },
  {
    href: '/subscriptions',
    label: '订阅管理',
    icon: <WalletCards className="h-4 w-4" />,
  },
  {
    href: '/payments',
    label: '支付订单',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    href: '/operation-logs',
    label: '操作日志',
    icon: <FileClock className="h-4 w-4" />,
  },
  {
    href: '/admins',
    label: '管理员管理',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    href: '/messages',
    label: '消息中心',
    icon: <Inbox className="h-4 w-4" />,
    badge: String(adminMessageSummary.unread),
  },
]
