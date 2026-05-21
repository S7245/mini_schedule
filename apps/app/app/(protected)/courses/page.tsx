'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAppCourses } from '@mini-schedule/api/app'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import type { Course, PageResponse } from '@mini-schedule/types'

export default function CoursesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAppCourses(page, 20) as {
    data: PageResponse<Course> | undefined
    isLoading: boolean
  }

  const difficultyLabels: Record<string, string> = { beginner: '入门', intermediate: '进阶', advanced: '高级' }
  const typeLabels: Record<string, string> = { strength: '力量', cardio: '有氧', flexibility: '柔韧', hiit: 'HIIT' }

  return (
    <ProtectedLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">课程</h1>

        {isLoading ? <p className="text-muted-foreground">加载中...</p> : !data?.items.length ? <p className="text-muted-foreground">暂无课程</p> : (
          <div className="grid gap-3">
            {data.items.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    {c.cover_url ? (
                      <img src={c.cover_url} alt={c.title} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-3xl">
                        🏋️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{c.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {typeLabels[c.type] ?? c.type} · {difficultyLabels[c.difficulty]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {c.duration_min} 分钟{c.calorie_estimate ? ` · ~${c.calorie_estimate} 千卡` : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {data && data.total > data.page_size && (
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / data.page_size)} onClick={() => setPage((p) => p + 1)}>下一页</Button>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
