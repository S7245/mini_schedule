'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAppCourse } from '@mini-schedule/api/app'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'

const typeLabels: Record<string, string> = { strength: '力量训练', cardio: '有氧训练', flexibility: '柔韧性训练', hiit: '高强度间歇' }
const difficultyLabels: Record<string, string> = { beginner: '入门', intermediate: '进阶', advanced: '高级' }

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading } = useAppCourse(id)

  if (isLoading) return <ProtectedLayout><div className="p-4"><p className="text-muted-foreground">加载中...</p></div></ProtectedLayout>
  if (!data) return <ProtectedLayout><div className="p-4"><p className="text-muted-foreground">课程不存在</p></div></ProtectedLayout>

  return (
    <ProtectedLayout>
      <div className="p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">← 返回</Button>

        {data.cover_url && (
          <img src={data.cover_url} alt={data.title} className="w-full h-48 object-cover rounded-xl" />
        )}

        <div>
          <h1 className="text-xl font-bold">{data.title}</h1>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{typeLabels[data.type]}</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{difficultyLabels[data.difficulty]}</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{data.duration_min} 分钟</span>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>课程描述</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{data.description || '暂无描述'}</p>
          </CardContent>
        </Card>

        {data.calorie_estimate && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">预计消耗</p>
              <p className="text-2xl font-bold">{data.calorie_estimate} <span className="text-sm font-normal text-muted-foreground">千卡</span></p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  )
}
