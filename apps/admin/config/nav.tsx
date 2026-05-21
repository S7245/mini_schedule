import { Building2, Inbox, LayoutDashboard, Shield } from 'lucide-react'
import type { BackofficeNavItem } from '@mini-schedule/admin-system'

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
    href: '/admins',
    label: '管理员管理',
    icon: <Shield className="h-4 w-4" />,
  },
  {
    href: '/messages',
    label: '消息中心',
    icon: <Inbox className="h-4 w-4" />,
    badge: '4',
  },
]
