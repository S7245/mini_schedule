import {
  BookOpen,
  Contact,
  Dumbbell,
  Inbox,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import type { BackofficeNavItem } from '@mini-schedule/admin-system'
import { brandMessageSummary } from '@/lib/message-center-data'

export const brandNavItems: BackofficeNavItem[] = [
  {
    href: '/dashboard',
    label: '概览',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: '/staff',
    label: '员工管理',
    icon: <Contact className="h-4 w-4" />,
  },
  {
    href: '/roles',
    label: '角色管理',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    href: '/users',
    label: '学员管理',
    icon: <UsersRound className="h-4 w-4" />,
  },
  {
    href: '/courses',
    label: '课程管理',
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    href: '/trainings',
    label: '训练记录',
    icon: <Dumbbell className="h-4 w-4" />,
  },
  {
    href: '/messages',
    label: '消息中心',
    icon: <Inbox className="h-4 w-4" />,
    badge: String(brandMessageSummary.unread),
  },
]
