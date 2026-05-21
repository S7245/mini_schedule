'use client'

import Link from 'next/link'
import { useAppProfile, useAppCourses } from '@mini-schedule/api/app'
import { Card, CardContent } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'

export default function DashboardPage() {
  const { data: profile } = useAppProfile()
  const { data: courses } = useAppCourses(1, 4)

  return (
    <ProtectedLayout>
      <div className="p-4 space-y-4">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <h1 className="text-xl font-bold">
              你好，{profile?.nickname || '健身者'} 👋
            </h1>
            <p className="text-blue-100 mt-1">
              {profile?.vip_level === 'vip' ? '👑 VIP 会员' : '普通用户'}
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">--</p>
              <p className="text-xs text-muted-foreground mt-1">本周训练</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">--</p>
              <p className="text-xs text-muted-foreground mt-1">总时长</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Courses */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">推荐课程</h2>
            <Link href="/courses" className="text-sm text-primary">查看全部</Link>
          </div>
          <div className="grid gap-3">
            {courses?.items.slice(0, 3).map((c) => (
              <Link key={c.id} href={`/courses/${c.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    {c.cover_url ? (
                      <img src={c.cover_url} alt={c.title} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">
                        🏋️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.duration_min} 分钟 · {c.difficulty === 'beginner' ? '入门' : c.difficulty === 'intermediate' ? '进阶' : '高级'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
