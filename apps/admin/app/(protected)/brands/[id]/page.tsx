'use client'

import { useParams, useRouter } from 'next/navigation'
import { useBrand } from '@mini-schedule/api/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const statusLabels: Record<string, string> = { active: '已启用', inactive: '已停用', pending: '待审核' }

export default function BrandDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading } = useBrand(id)

  if (isLoading) return <p className="text-muted-foreground">加载中...</p>
  if (!data) return <p className="text-muted-foreground">品牌不存在</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">品牌详情</h1>
        <Button variant="outline" onClick={() => router.push('/brands')}>返回列表</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><span className="text-sm text-muted-foreground">ID</span><p className="font-mono text-sm">{data.id}</p></div>
            <div><span className="text-sm text-muted-foreground">名称</span><p className="font-medium">{data.name}</p></div>
            <div><span className="text-sm text-muted-foreground">状态</span><p>{statusLabels[data.status]}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>联系信息</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><span className="text-sm text-muted-foreground">联系人</span><p>{data.contact_name ?? '-'}</p></div>
            <div><span className="text-sm text-muted-foreground">电话</span><p>{data.contact_phone ?? '-'}</p></div>
            <div><span className="text-sm text-muted-foreground">邮箱</span><p>{data.contact_email ?? '-'}</p></div>
            {data.logo_url && <div><span className="text-sm text-muted-foreground">Logo</span><img src={data.logo_url} alt={data.name} className="w-16 h-16 rounded-lg border mt-1" /></div>}
          </CardContent>
        </Card>
      </div>
      <div className="text-xs text-muted-foreground">
        创建时间: {new Date(data.created_at).toLocaleString('zh-CN')} · 更新时间: {new Date(data.updated_at).toLocaleString('zh-CN')}
      </div>
    </div>
  )
}
