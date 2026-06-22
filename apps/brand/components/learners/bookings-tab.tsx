'use client'

import { useBrandBookings } from '@mini-schedule/api/bookings'
import type { BookingStatus } from '@mini-schedule/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATUS_LABELS: Record<BookingStatus, string> = {
  booked: '已预约',
  cancelled: '已取消',
  attended: '已到课',
  pending_no_show: '待确认爽约',
  no_show: '已爽约',
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  booked: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-600',
  attended: 'bg-sky-100 text-sky-800',
  pending_no_show: 'bg-amber-100 text-amber-800',
  no_show: 'bg-rose-100 text-rose-800',
}

function fmt(ts: string): string {
  return ts ? ts.slice(0, 16).replace('T', ' ') : '—'
}

export function BookingsTab({ learnerId }: { learnerId: number }) {
  const query = useBrandBookings({
    brand_learner_profile_id: learnerId,
    page: 1,
    page_size: 50,
  })
  const items = query.data?.items ?? []

  if (query.isLoading) {
    return <p className="p-8 text-center text-sm text-muted-foreground">加载中...</p>
  }
  if (items.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        暂无预约记录。可在「预约管理」为该学员代预约。
      </p>
    )
  }

  return (
    <div className="p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>课程</TableHead>
            <TableHead>上课时间</TableHead>
            <TableHead>门店</TableHead>
            <TableHead>权益</TableHead>
            <TableHead>状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((b) => (
            <TableRow key={b.id} data-testid="learner-booking-row">
              <TableCell className="font-medium">{b.course_title}</TableCell>
              <TableCell className="text-muted-foreground">
                {fmt(b.session_starts_at)}
              </TableCell>
              <TableCell className="text-muted-foreground">{b.location_name}</TableCell>
              <TableCell>
                {b.hold ? (
                  b.hold.product_name
                ) : b.requires_entitlement_fix ? (
                  <span className="text-amber-600">待补权益</span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status]}`}
                >
                  {STATUS_LABELS[b.status]}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
