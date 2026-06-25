'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@mini-schedule/api/auth'
import { Button } from '@/components/ui/button'

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }
    if (user?.user_type !== 'app') {
      router.push('/unauthorized')
    }
  }, [isAuthenticated, user, router, pathname])

  if (!isAuthenticated) return null

  // 菜单对齐 blueprint §14.4（学员小程序）。课程表/我的预约为 Batch 14a 自助预约；
  // legacy /courses、/trainings 页仍保留路由（app_users 退役留 FR），暂不入底部导航。
  const navItems = [
    { href: '/dashboard', label: '首页', icon: '🏠' },
    { href: '/class-sessions', label: '课程表', icon: '📅' },
    { href: '/bookings', label: '我的预约', icon: '🎫' },
    { href: '/profile', label: '我的', icon: '👤' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {children}
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
