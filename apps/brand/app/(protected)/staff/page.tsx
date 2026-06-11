'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, UsersRound } from 'lucide-react'
import { useBrandStaffList } from '@mini-schedule/api/staff'
import type {
  RoleAssignment,
  StaffListItem,
  StaffStatusFilter,
} from '@mini-schedule/types'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StaffStatusToggle } from '@/components/staff/staff-status-toggle'
import { StaffCreateDialog } from '@/components/staff/staff-create-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

const STATUS_LABELS: Record<string, string> = {
  active: '启用',
  inactive: '停用',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-700',
}

function describePrimaryLocation(staff: StaffListItem): string {
  const assignments = staff.location_assignments ?? []
  const primary = assignments.find((a) => a.is_primary)
  if (primary) return primary.location_name ?? `门店 #${primary.location_id}`
  const first = assignments[0]
  if (first) return first.location_name ?? `门店 #${first.location_id}`
  return '—'
}

function renderRoleChips(roles: RoleAssignment[]) {
  if (!roles || roles.length === 0) {
    return <span className="text-xs text-muted-foreground">未分配</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r, i) => (
        <span
          key={`${r.role_id}-${r.location_id ?? 'brand'}-${i}`}
          className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {r.role_name}
          {r.location_name ? (
            <span className="ml-1 text-primary/60">@{r.location_name}</span>
          ) : null}
        </span>
      ))}
    </div>
  )
}

export default function StaffListPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('all')
  const [q, setQ] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { has } = usePermissions()
  const canCreate = has(PERMISSIONS.STAFF_CREATE)

  // q is local filter — backend supports `q` param; we pass through with a tiny
  // debounce-less approach because the dataset is small (max 200 in this batch).
  const listQuery = useBrandStaffList({
    page,
    page_size: pageSize,
    status: statusFilter,
    q: q.trim() || undefined,
  })

  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0

  const totalPages = useMemo(() => {
    if (!total) return 1
    return Math.max(1, Math.ceil(total / pageSize))
  }, [total, pageSize])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">员工管理</h1>
          <p className="text-sm text-muted-foreground">
            管理品牌员工、角色与门店任职。品牌负责人由系统自动分配，无法手动新增。
          </p>
        </div>
        <Hint content={canCreate ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={!canCreate}
            data-testid="staff-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            新增员工
          </Button>
        </Hint>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名或手机号"
            className="pl-8"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            data-testid="staff-search-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">状态</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StaffStatusFilter)
              setPage(1)
            }}
          >
            <SelectTrigger
              className="w-32"
              data-testid="staff-status-filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="inactive">停用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {listQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UsersRound className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              暂无员工，点击右上角"新增员工"添加第一个员工
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>主门店</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>教练</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((staff) => (
                <TableRow
                  key={staff.id}
                  data-testid={`staff-row-${staff.id}`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/staff/${staff.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {staff.name}
                      </Link>
                      {staff.is_owner ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                          负责人
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {staff.phone}
                  </TableCell>
                  <TableCell>{renderRoleChips(staff.role_assignments)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {describePrimaryLocation(staff)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[staff.status] ?? ''
                      }`}
                    >
                      {STATUS_LABELS[staff.status] ?? staff.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {staff.has_instructor ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        教练
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/staff/${staff.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        详情
                      </Link>
                      <StaffStatusToggle staff={staff} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {total} 名员工 · 第 {page} / {totalPages} 页
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
      ) : null}

      <StaffCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
