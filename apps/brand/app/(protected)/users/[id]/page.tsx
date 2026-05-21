'use client'

import { useParams, useRouter } from 'next/navigation'
import { useBrandUser } from '@mini-schedule/api/brand'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading } = useBrandUser(id)

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
          <p className="text-muted-foreground">用户不存在</p>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">学员详情</h1>
          <Button variant="outline" onClick={() => router.push('/users')}>
            返回列表
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">ID</span>
                <p className="font-mono text-sm">{data.id}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">手机号</span>
                <p>{data.phone ?? '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">昵称</span>
                <p>{data.nickname ?? '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">角色</span>
                <p>{data.role === 'vip' ? 'VIP' : '普通用户'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>其他信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">OpenID</span>
                <p className="font-mono text-sm truncate">{data.openid ?? '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">头像</span>
                {data.avatar_url ? (
                  <img src={data.avatar_url} alt="avatar" className="w-12 h-12 rounded-full" />
                ) : (
                  <p>-</p>
                )}
              </div>
              <div>
                <span className="text-sm text-muted-foreground">注册时间</span>
                <p>{new Date(data.created_at).toLocaleString('zh-CN')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
