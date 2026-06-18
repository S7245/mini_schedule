import {
  BookOpen,
  Boxes,
  CalendarClock,
  Contact,
  Dumbbell,
  Inbox,
  LayoutDashboard,
  ShieldCheck,
  Store,
  Tag,
  Tags,
  Ticket,
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
    href: '/locations',
    label: '门店管理',
    icon: <Store className="h-4 w-4" />,
  },
  {
    href: '/resources',
    label: '资源管理',
    icon: <Boxes className="h-4 w-4" />,
  },
  {
    href: '/roles',
    label: '角色管理',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    href: '/learners',
    label: '学员管理',
    icon: <UsersRound className="h-4 w-4" />,
  },
  {
    href: '/learner-tags',
    label: '学员标签',
    icon: <Tag className="h-4 w-4" />,
  },
  {
    href: '/entitlement-products',
    label: '权益产品',
    icon: <Ticket className="h-4 w-4" />,
  },
  {
    href: '/course-categories',
    label: '课程分类',
    icon: <Tags className="h-4 w-4" />,
  },
  {
    href: '/courses',
    label: '课程模板',
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    href: '/schedule',
    label: '排课',
    icon: <CalendarClock className="h-4 w-4" />,
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
