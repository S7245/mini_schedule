'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">概览</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">学员总数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">待接入</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">课程总数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">待接入</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">今日训练</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">待接入</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
