'use client'

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { useBrandReportOverview } from '@mini-schedule/api/reports'
import { useBrandLocations } from '@mini-schedule/api/locations'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const RANGE_LABELS: Record<string, string> = {
  today: '今日',
  this_week: '本周',
  this_month: '本月',
  custom: '自定义',
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export default function ReportsPage() {
  const { has, isLoading: permsLoading } = usePermissions()
  const canView = has(PERMISSIONS.REPORT_VIEW_BASIC)

  const [range, setRange] = useState('this_month')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [locationId, setLocationId] = useState('all')

  const locationsQuery = useBrandLocations(1, 100, 'active', undefined, canView)
  const locations = locationsQuery.data?.items ?? []

  const customReady = range !== 'custom' || (fromDate !== '' && toDate !== '')
  const params = {
    range,
    ...(range === 'custom' ? { from: fromDate, to: toDate } : {}),
    ...(locationId !== 'all' ? { location_id: Number(locationId) } : {}),
  }
  const { data, isLoading, isError } = useBrandReportOverview(
    params,
    canView && customReady,
  )

  const pct = (r: number) => `${(r * 100).toFixed(1)}%`
  const num = (n: number) => n.toLocaleString()

  if (!permsLoading && !canView) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-xl font-semibold tracking-tight">报表</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">无权查看报表</CardTitle>
            <CardDescription>
              该功能需要「查看基础报表」权限，请联系品牌管理员。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">运营看板</h1>
          <p className="text-sm text-muted-foreground">
            预约、到课、上座率、权益与候补等基础运营指标。
          </p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-32" data-testid="report-range-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RANGE_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
              data-testid="report-from"
            />
            <span className="text-muted-foreground">至</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
              data-testid="report-to"
            />
          </div>
        )}

        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-44" data-testid="report-location-filter">
            <SelectValue placeholder="全部门店" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部门店</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={String(loc.id)}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Card>
          <CardHeader>
            <CardDescription>加载报表失败，请稍后重试。</CardDescription>
          </CardHeader>
        </Card>
      )}

      {range === 'custom' && !customReady && (
        <p className="text-sm text-muted-foreground">请选择自定义起止日期。</p>
      )}

      {data && (
        <>
          {/* 标量指标卡片 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            <MetricCard label="预约数" value={num(data.bookings_total)} />
            <MetricCard label="到课数" value={num(data.attended_total)} />
            <MetricCard label="取消数" value={num(data.cancelled_total)} />
            <MetricCard label="爽约数" value={num(data.no_show_total)} />
            <MetricCard label="上座率" value={pct(data.occupancy_rate)} />
            <MetricCard
              label="待处理爽约"
              value={num(data.pending_no_show_total)}
            />
            <MetricCard label="候补人数" value={num(data.waitlist_total)} />
            <MetricCard
              label="权益锁定次数"
              value={num(data.entitlement_locked_total)}
            />
            <MetricCard
              label="权益消耗次数"
              value={num(data.entitlement_consumed_total)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 热门课程 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">热门课程 Top5</CardTitle>
                <CardDescription>按预约数排序</CardDescription>
              </CardHeader>
              <CardContent>
                {data.popular_courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无数据</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>课程</TableHead>
                        <TableHead className="text-right">预约数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.popular_courses.map((c) => (
                        <TableRow key={c.course_id}>
                          <TableCell>{c.title}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {num(c.booking_count)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Location 分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">门店分布</CardTitle>
                <CardDescription>场次数 / 预约数</CardDescription>
              </CardHeader>
              <CardContent>
                {data.location_distribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无数据</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>门店</TableHead>
                        <TableHead className="text-right">场次</TableHead>
                        <TableHead className="text-right">预约</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.location_distribution.map((l) => (
                        <TableRow key={l.location_id}>
                          <TableCell>{l.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {num(l.session_count)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {num(l.booking_count)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Instructor 场次 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">教练授课场次</CardTitle>
              </CardHeader>
              <CardContent>
                {data.instructor_sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无数据</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>教练</TableHead>
                        <TableHead className="text-right">场次数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.instructor_sessions.map((i) => (
                        <TableRow key={i.instructor_profile_id}>
                          <TableCell>{i.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {num(i.session_count)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {isLoading && !data && (
        <p className="text-sm text-muted-foreground">加载中…</p>
      )}
    </div>
  )
}
