'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'
import {
  usePaymentCallbackLogs,
  usePaymentTransactions,
  useSaaSPlanOrders,
  useCompensateOrder,
} from '@mini-schedule/api/admin'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DataTable } from '@mini-schedule/admin-system/components/data-table'
import { EmptyState } from '@mini-schedule/admin-system/components/empty-state'
import { LoadingState } from '@mini-schedule/admin-system/components/loading-state'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { SectionCard } from '@mini-schedule/admin-system/components/section-card'
import { StatusBadge } from '@mini-schedule/admin-system/components/status-badge'
import type { PaymentCallbackLog, PaymentTransaction, SaaSPlanOrder } from '@mini-schedule/types'

const orderStatusTone: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  pending_payment: 'warning',
  exception: 'danger',
  failed: 'danger',
  closed: 'neutral',
  refunded: 'neutral',
  refunding: 'warning',
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

// 卡单（未支付 / 异常）可人工补偿开通订阅。
function CompensateAction({ order }: { order: SaaSPlanOrder }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const compensate = useCompensateOrder()

  const eligible = order.status === 'pending_payment' || order.status === 'exception'
  if (!eligible) return <span className="text-xs text-muted-foreground">-</span>

  const submit = () => {
    const r = reason.trim()
    if (!r) {
      toast.error('请填写补偿原因')
      return
    }
    compensate.mutate(
      { id: order.id, reason: r },
      {
        onSuccess: (res) => {
          toast.success(
            res.already_paid
              ? '订单已是已支付状态，无需重复补偿'
              : `补偿成功，已开通订阅 #${res.subscription_id}`,
          )
          setOpen(false)
          setReason('')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          补偿开通
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>人工补偿开通订阅</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            订单 <span className="font-mono">{order.out_trade_no}</span>（Brand #{order.brand_id} · ¥{order.amount}）。
            核实付款已到账后，将按订单套餐开通订阅并激活品牌。
          </p>
          <Textarea
            placeholder="补偿原因（如：已核实银行到账 / 客服工单号）"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">取消</Button>
          </DialogClose>
          <Button onClick={submit} disabled={compensate.isPending}>
            {compensate.isPending ? '提交中…' : '确认补偿'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OrderTable({ orders, isLoading }: { orders: SaaSPlanOrder[]; isLoading: boolean }) {
  if (isLoading) return <LoadingState title="正在加载订单" />
  if (!orders.length) return <EmptyState title="暂无套餐订单" description="品牌自助购买或人工补偿后，这里会出现订单记录。" />

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>订单</TableHead>
            <TableHead>品牌/套餐</TableHead>
            <TableHead>来源</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div className="font-mono text-sm">{order.out_trade_no}</div>
                <div className="text-xs text-muted-foreground">#{order.id}</div>
              </TableCell>
              <TableCell>
                <div>Brand #{order.brand_id}</div>
                <div className="text-xs text-muted-foreground">Plan #{order.plan_id}</div>
              </TableCell>
              <TableCell>{order.source}</TableCell>
              <TableCell className="tabular-nums">¥{order.amount}</TableCell>
              <TableCell>
                <StatusBadge label={order.status} tone={orderStatusTone[order.status] ?? 'neutral'} />
              </TableCell>
              <TableCell>{formatDate(order.created_at)}</TableCell>
              <TableCell>
                <CompensateAction order={order} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  )
}

function TransactionTable({ transactions, isLoading }: { transactions: PaymentTransaction[]; isLoading: boolean }) {
  if (isLoading) return <LoadingState title="正在加载支付流水" />
  if (!transactions.length) return <EmptyState title="暂无支付流水" description="微信支付回调或支付查询写入后，这里会出现流水。" />

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>流水</TableHead>
            <TableHead>订单</TableHead>
            <TableHead>通道</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>支付时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.out_trade_no}</TableCell>
              <TableCell>{item.order_id ? `#${item.order_id}` : '-'}</TableCell>
              <TableCell>{item.payment_channel}</TableCell>
              <TableCell className="tabular-nums">¥{item.amount}</TableCell>
              <TableCell>
                <StatusBadge label={item.status} tone={item.status === 'succeeded' ? 'success' : item.status === 'failed' ? 'danger' : 'warning'} />
              </TableCell>
              <TableCell>{formatDate(item.paid_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  )
}

function CallbackTable({ callbacks, isLoading }: { callbacks: PaymentCallbackLog[]; isLoading: boolean }) {
  if (isLoading) return <LoadingState title="正在加载回调日志" />
  if (!callbacks.length) return <EmptyState title="暂无回调日志" description="支付通知到达后，这里会出现验签和处理结果。" />

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>回调</TableHead>
            <TableHead>订单</TableHead>
            <TableHead>通道</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>错误</TableHead>
            <TableHead>时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {callbacks.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.callback_request_id || `#${item.id}`}</TableCell>
              <TableCell>{item.order_id ? `#${item.order_id}` : '-'}</TableCell>
              <TableCell>{item.payment_channel}</TableCell>
              <TableCell>
                <StatusBadge label={item.status} tone={item.status === 'processed' ? 'success' : item.status === 'failed' ? 'danger' : 'warning'} />
              </TableCell>
              <TableCell className="max-w-[260px] truncate">{item.error_message || '-'}</TableCell>
              <TableCell>{formatDate(item.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  )
}

export default function PaymentsPage() {
  const ordersQuery = useSaaSPlanOrders(1, 10)
  const transactionsQuery = usePaymentTransactions(1, 10)
  const callbacksQuery = usePaymentCallbackLogs(1, 10)

  const exceptionOrders = ordersQuery.data?.items.filter((item) => item.status === 'exception' || item.status === 'failed').length ?? 0
  const failedCallbacks = callbacksQuery.data?.items.filter((item) => item.status === 'failed').length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader title="支付订单" description="查看 SaaS 套餐订单、支付流水和回调处理结果。" />

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="订单状态">
          <div className="flex items-center gap-2 text-foreground">
            <Clock3 className="size-4 text-primary" />
            今日和近期订单按创建时间倒序展示
          </div>
        </SectionCard>
        <SectionCard title="支付异常">
          <div className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="size-4 text-amber-600" />
            当前页异常订单 {exceptionOrders}
          </div>
        </SectionCard>
        <SectionCard title="回调处理">
          <div className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="size-4 text-emerald-600" />
            当前页失败回调 {failedCallbacks}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="套餐订单">
        <OrderTable orders={ordersQuery.data?.items ?? []} isLoading={ordersQuery.isLoading} />
      </SectionCard>
      <SectionCard title="支付流水">
        <TransactionTable transactions={transactionsQuery.data?.items ?? []} isLoading={transactionsQuery.isLoading} />
      </SectionCard>
      <SectionCard title="回调日志">
        <CallbackTable callbacks={callbacksQuery.data?.items ?? []} isLoading={callbacksQuery.isLoading} />
      </SectionCard>
    </div>
  )
}
