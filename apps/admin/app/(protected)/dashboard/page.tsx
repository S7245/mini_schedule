'use client'

import Link from 'next/link'
import { Activity, ArrowUpRight, Building2, CircleAlert, Inbox, Server, Shield } from 'lucide-react'
import { useAdmins, useBrands } from '@mini-schedule/api/admin'
import { Button } from '@/components/ui/button'
import { DashboardPageTemplate } from '@mini-schedule/admin-system/templates/dashboard-page-template'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { StatCard } from '@mini-schedule/admin-system/components/stat-card'
import { SectionCard } from '@mini-schedule/admin-system/components/section-card'
import type { Brand, PageResponse } from '@mini-schedule/types'
import { adminMessagePreview, adminMessageSummary } from '@/lib/message-center-data'
import type { MessageCenterItem } from '@mini-schedule/admin-system/models/message-center'

function formatCount(value?: number) {
  if (typeof value !== 'number') return '--'
  return value.toLocaleString('zh-CN')
}

function StatusBars({ brands }: { brands: Brand[] }) {
  const total = brands.length || 1
  const statuses = [
    { label: '已启用', value: brands.filter((brand) => brand.status === 'active').length, className: 'bg-chart-4' },
    { label: '待审核', value: brands.filter((brand) => brand.status === 'pending').length, className: 'bg-chart-3' },
    { label: '已停用', value: brands.filter((brand) => brand.status === 'suspended').length, className: 'bg-destructive' },
  ]

  return (
    <div className="space-y-4">
      {statuses.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="tabular-nums text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${item.className}`}
              style={{ width: item.value > 0 ? `${Math.max(8, (item.value / total) * 100)}%` : '0%' }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">状态分布基于当前已加载品牌页，非全平台聚合。</p>
    </div>
  )
}

function TrendPreview() {
  const bars = [38, 52, 45, 66, 58, 74, 69, 86, 78, 92, 84, 96]

  return (
    <div className="h-[260px]">
      <div className="flex h-full items-end gap-2 rounded-lg bg-muted/45 p-4">
        {bars.map((height, index) => (
          <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t-md bg-primary/85" style={{ height: `${height}%` }} />
            <span className="hidden text-[10px] text-muted-foreground sm:inline">{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentBrands({ brands }: { brands: Brand[] }) {
  if (!brands.length) {
    return <p>暂无品牌数据。创建品牌后，这里会显示最近接入的品牌。</p>
  }

  return (
    <div className="space-y-4">
      {brands.slice(0, 5).map((brand) => (
        <div key={brand.id} className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
            {brand.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{brand.name}</p>
            <p className="truncate text-xs text-muted-foreground">{brand.contact_name ?? '未填写联系人'}</p>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {brand.status}
          </span>
        </div>
      ))}
    </div>
  )
}

function MessageQueuePreview() {
  return (
    <div className="space-y-4">
      {adminMessagePreview.map((message: MessageCenterItem) => (
        <div key={message.id} className="space-y-2 rounded-md border border-border bg-background px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {message.title}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {message.sender} · {message.sourceLabel}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {message.status === 'resolved' ? '已解决' : '待处理'}
            </span>
          </div>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {message.body}
          </p>
        </div>
      ))}
      <Link
        href="/messages"
        className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2 text-sm text-foreground transition hover:bg-accent"
      >
        <span className="flex items-center gap-2">
          <Inbox className="size-4 text-primary" />
          打开消息中心
        </span>
        <ArrowUpRight className="size-4 text-muted-foreground" />
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const brandsQuery = useBrands(1, 20) as {
    data: PageResponse<Brand> | undefined
    isLoading: boolean
    isError: boolean
  }
  const adminsQuery = useAdmins(1, 1) as {
    data: PageResponse<unknown> | undefined
    isLoading: boolean
    isError: boolean
  }

  const brands = brandsQuery.data?.items ?? []
  const isLoading = brandsQuery.isLoading || adminsQuery.isLoading
  const hasError = brandsQuery.isError || adminsQuery.isError

  return (
    <DashboardPageTemplate
      header={
        <PageHeader
          title="平台概览"
          description="关注品牌入驻、平台账号与运营健康度。当前版本优先呈现骨架和可验证数据，待后端 summary API 完成后替换汇总指标。"
          actions={
            <Button asChild>
              <Link href="/brands">管理品牌</Link>
            </Button>
          }
        />
      }
      stats={
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="品牌总数"
            value={isLoading ? '--' : formatCount(brandsQuery.data?.total)}
            hint="来自品牌分页接口的 total"
            trend={hasError ? '异常' : '实时'}
            tone={hasError ? 'danger' : 'success'}
          />
          <StatCard
            label="平台管理员"
            value={isLoading ? '--' : formatCount(adminsQuery.data?.total)}
            hint="当前可登录后台的账号数"
            trend={hasError ? '异常' : '实时'}
            tone={hasError ? 'danger' : 'success'}
          />
          <StatCard
            label="未读消息"
            value={String(adminMessageSummary.unread)}
            hint="待平台运营优先处理的消息"
            trend={`${adminMessageSummary.highPriority} 条高优`}
            tone={adminMessageSummary.highPriority > 0 ? 'warning' : 'success'}
          />
          <StatCard
            label="运营健康"
            value={hasError ? '需检查' : '稳定'}
            hint="基于当前前端接口请求状态"
            trend={hasError ? '关注' : 'OK'}
            tone={hasError ? 'danger' : 'success'}
          />
        </div>
      }
      primary={
        <>
          <SectionCard title="品牌增长趋势" description="视觉结构先按 dashboard 图表位搭建，后续接入真实时间序列。">
            <TrendPreview />
          </SectionCard>

          <SectionCard title="品牌状态抽样" description="展示当前页品牌状态分布，避免把分页数据伪装成全局统计。">
            <StatusBars brands={brands} />
          </SectionCard>

          <SectionCard
            title="待处理消息"
            description="把入驻审核、账号支持和内容异常放回概览首页，方便平台运营直接切入消息中心。"
          >
            <MessageQueuePreview />
          </SectionCard>
        </>
      }
      secondary={
        <>
          <SectionCard title="近期品牌" description="从当前品牌列表读取，帮助运营快速进入详情。">
            <RecentBrands brands={brands} />
          </SectionCard>

          <SectionCard title="快捷操作">
            <div className="space-y-2">
              {[
                { href: '/brands', label: '查看品牌库', icon: Building2 },
                { href: '/admins', label: '管理平台账号', icon: Shield },
                { href: '/brands', label: '处理入驻状态', icon: CircleAlert },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition hover:bg-accent"
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="size-4 text-primary" />
                    {item.label}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="系统状态"
            className="bg-foreground text-background [&_h2]:text-background [&_p]:text-background/65"
          >
            <div className="space-y-4 text-background/75">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Server className="size-4 text-primary" />
                  Admin API
                </span>
                <span className="rounded-full bg-background/10 px-2 py-0.5 text-xs text-background">
                  {hasError ? '检查接口' : '请求正常'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  Summary API
                </span>
                <span className="rounded-full bg-background/10 px-2 py-0.5 text-xs text-background">
                  待后端接入
                </span>
              </div>
            </div>
          </SectionCard>
        </>
      }
    />
  )
}
