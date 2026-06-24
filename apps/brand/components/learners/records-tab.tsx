'use client'

import { useBrandBookings } from '@mini-schedule/api/bookings'
import type { Booking, BookingStatus } from '@mini-schedule/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// 履约记录只展示终态/待处理：到课 / 爽约 / 待爽约（已约/已取消属预约 Tab）。
const FULFILLMENT_STATUSES: BookingStatus[] = [
  'attended',
  'no_show',
  'pending_no_show',
]

const STATUS_LABELS: Record<string, string> = {
  attended: '已到课',
  no_show: '已爽约',
  pending_no_show: '待爽约',
}

const STATUS_BADGE: Record<string, string> = {
  attended: 'bg-emerald-100 text-emerald-800',
  no_show: 'bg-rose-100 text-rose-800',
  pending_no_show: 'bg-amber-100 text-amber-800',
}

function fmt(ts: string): string {
  return ts ? ts.slice(0, 16).replace('T', ' ') : '—'
}

// 权益结算结果。注意：released hold 被预约详情 join 过滤（status<>'released'），
// 故终态无 hold 即「爽约退课」。
function settleLabel(b: Booking): string {
  if (b.requires_entitlement_fix) return '占位·无权益'
  if (b.hold) {
    return b.hold.status === 'consumed'
      ? `${b.hold.product_name}（已消耗）`
      : b.hold.product_name
  }
  if (b.status === 'no_show') return '已退回（退课）'
  return '—'
}

export function RecordsTab({ learnerId }: { learnerId: number }) {
  const query = useBrandBookings({
    brand_learner_profile_id: learnerId,
    page: 1,
    page_size: 50,
  })
  const items = (query.data?.items ?? []).filter((b) =>
    FULFILLMENT_STATUSES.includes(b.status),
  )

  if (query.isLoading) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">加载中...</p>
    )
  }
  if (items.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        暂无履约记录。学员到课签到或确认爽约后在此展示。
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
            <TableHead>权益结算</TableHead>
            <TableHead>履约</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((b) => (
            <TableRow key={b.id} data-testid="learner-record-row">
              <TableCell className="font-medium">{b.course_title}</TableCell>
              <TableCell className="text-muted-foreground">
                {fmt(b.session_starts_at)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {b.location_name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {settleLabel(b)}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] ?? ''}`}
                >
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
