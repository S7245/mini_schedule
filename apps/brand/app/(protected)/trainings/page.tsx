'use client'

import { useState } from 'react'
import { useBrandTrainings } from '@mini-schedule/api/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { getBackofficePagination, getBackofficePaginationLabel } from '@mini-schedule/admin-system/models/pagination'
import { filterBackofficeItemsByQuery } from '@mini-schedule/admin-system/models/search'
import type { TrainingRecord, PageResponse } from '@mini-schedule/types'

export default function TrainingsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useBrandTrainings(page, 20) as {
    data: PageResponse<TrainingRecord> | undefined
    isLoading: boolean
  }
  const pagination = getBackofficePagination({
    page: data?.page ?? page,
    totalItems: data?.total,
    pageSize: data?.page_size,
  })

  const filteredItems = filterBackofficeItemsByQuery(
    data?.items ?? [],
    search,
    (record) => [record.user_id, record.notes],
  )

  return (
    <ProtectedLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">训练记录</h1>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">加载中...</p>
        ) : !data?.items.length ? (
          <p className="text-muted-foreground">暂无训练记录</p>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <CardTitle>训练列表</CardTitle>
                  <div className="ml-auto">
                    <Input placeholder="搜索用户 ID 或备注..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户 ID</TableHead>
                      <TableHead>课程</TableHead>
                      <TableHead>时长</TableHead>
                      <TableHead>消耗卡路里</TableHead>
                      <TableHead>训练时间</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          无匹配记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-mono text-sm">{t.user_id}</TableCell>
                          <TableCell>{t.course_id ? <span className="font-mono text-sm">{t.course_id}</span> : <span className="text-muted-foreground">自由训练</span>}</TableCell>
                          <TableCell>{t.duration_minutes} 分钟</TableCell>
                          <TableCell>{t.calories_burned ?? '—'} kcal</TableCell>
                          <TableCell>{new Date(t.trained_at).toLocaleDateString('zh-CN')}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">{t.notes ?? '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">{getBackofficePaginationLabel(pagination)}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!pagination.canGoPrevious} onClick={() => setPage((p) => p - 1)}>
                      上一页
                    </Button>
                    <Button variant="outline" size="sm" disabled={!pagination.canGoNext} onClick={() => setPage((p) => p + 1)}>
                      下一页
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProtectedLayout>
  )
}
