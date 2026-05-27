'use client'

import { useState } from 'react'
import { useOperationLogs } from '@mini-schedule/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTable } from '@mini-schedule/admin-system/components/data-table'
import { EmptyState } from '@mini-schedule/admin-system/components/empty-state'
import { FilterBar } from '@mini-schedule/admin-system/components/filter-bar'
import { LoadingState } from '@mini-schedule/admin-system/components/loading-state'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { ResourceListPage } from '@mini-schedule/admin-system/templates/resource-list-page'
import { getBackofficePagination, getBackofficePaginationLabel } from '@mini-schedule/admin-system/models/pagination'
import type { OperationLog, PageResponse } from '@mini-schedule/types'

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

export default function OperationLogsPage() {
  const [page, setPage] = useState(1)
  const [brandID, setBrandID] = useState('')
  const [targetID, setTargetID] = useState('')
  const [targetType, setTargetType] = useState('brand_subscription')

  const query = useOperationLogs(page, 20, {
    brand_id: brandID,
    target_id: targetID,
    target_type: targetType,
  }) as {
    data: PageResponse<OperationLog> | undefined
    isLoading: boolean
  }

  const logs = query.data?.items ?? []
  const pagination = getBackofficePagination({
    page: query.data?.page ?? page,
    totalItems: query.data?.total,
    pageSize: query.data?.page_size,
  })

  return (
    <ResourceListPage
      header={<PageHeader title="操作日志" description="审计平台管理员对订阅、额度和状态的关键操作。" />}
      filters={
        <FilterBar>
          <div className="grid w-full gap-3 md:grid-cols-[160px_200px_160px_auto]">
            <div className="space-y-2">
              <Label htmlFor="brand_id">Brand ID</Label>
              <Input id="brand_id" value={brandID} onChange={(event) => setBrandID(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_type">目标类型</Label>
              <Input id="target_type" value={targetType} onChange={(event) => setTargetType(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_id">目标 ID</Label>
              <Input id="target_id" value={targetID} onChange={(event) => setTargetID(event.target.value)} />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBrandID('')
                  setTargetID('')
                  setTargetType('brand_subscription')
                  setPage(1)
                }}
              >
                重置
              </Button>
            </div>
          </div>
        </FilterBar>
      }
      content={
        query.isLoading ? (
          <LoadingState title="正在加载操作日志" />
        ) : !logs.length ? (
          <EmptyState title="暂无操作日志" description="手动续期、额度调整、冻结或解冻后会生成审计记录。" />
        ) : (
          <DataTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>动作</TableHead>
                  <TableHead>品牌</TableHead>
                  <TableHead>操作者</TableHead>
                  <TableHead>目标</TableHead>
                  <TableHead>原因</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.created_at)}</TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell>{log.brand_id ? `#${log.brand_id}` : '-'}</TableCell>
                    <TableCell>
                      {log.actor_type}
                      {log.actor_id ? ` #${log.actor_id}` : ''}
                    </TableCell>
                    <TableCell>
                      {log.target_type || '-'}
                      {log.target_id ? ` #${log.target_id}` : ''}
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate">{log.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        )
      }
      footer={
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-sm text-muted-foreground">{getBackofficePaginationLabel(pagination)}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.canGoPrevious} onClick={() => setPage((current) => current - 1)}>
              上一页
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.canGoNext} onClick={() => setPage((current) => current + 1)}>
              下一页
            </Button>
          </div>
        </div>
      }
    />
  )
}
