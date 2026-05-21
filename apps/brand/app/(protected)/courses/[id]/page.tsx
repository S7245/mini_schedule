'use client'

import { useParams, useRouter } from 'next/navigation'
import { useBrandCourse } from '@mini-schedule/api/brand'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'

const typeLabels: Record<string, string> = {
  strength: '力量训练',
  cardio: '有氧训练',
  flexibility: '柔韧性训练',
  hiit: '高强度间歇',
}

const difficultyLabels: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
}

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading } = useBrandCourse(id)

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </ProtectedLayout>
    )
  }

  if (!data) {
    return (
      <ProtectedLayout>
        <div className="p-8">
          <p className="text-muted-foreground">课程不存在</p>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">课程详情</h1>
          <Button variant="outline" onClick={() => router.push('/courses')}>
            返回列表
          </Button>
        </div>

        {data.cover_url && (
          <div className="mb-6">
            <img
              src={data.cover_url}
              alt={data.title}
              className="w-full max-w-md h-48 object-cover rounded-lg border"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">标题</span>
                <p className="font-medium">{data.title}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">类型</span>
                <p>{typeLabels[data.type] ?? data.type}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">难度</span>
                <p>{difficultyLabels[data.difficulty]}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">时长</span>
                <p>{data.duration_min} 分钟</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">状态</span>
                <p>{statusLabels[data.status]}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{data.description || '暂无描述'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          创建时间: {new Date(data.created_at).toLocaleString('zh-CN')}
          {' · '}更新时间: {new Date(data.updated_at).toLocaleString('zh-CN')}
        </div>
      </div>
    </ProtectedLayout>
  )
}
