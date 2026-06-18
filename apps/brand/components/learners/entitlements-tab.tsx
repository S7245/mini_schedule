'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import {
  useLearnerEntitlements,
  useGrantEntitlement,
  useAdjustEntitlement,
  useSetEntitlementStatus,
  useEntitlementTransactions,
} from '@mini-schedule/api/entitlements'
import { useBrandEntitlementProducts } from '@mini-schedule/api/entitlement-products'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  EntitlementAction,
  EntitlementStatus,
  LearnerEntitlement,
} from '@mini-schedule/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Hint } from '@/components/ui/hint'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

const STATUS_LABELS: Record<EntitlementStatus, string> = {
  active: '正常',
  frozen: '已冻结',
  cancelled: '已作废',
  expired: '已过期',
  depleted: '已用完',
}
const STATUS_BADGE: Record<EntitlementStatus, string> = {
  active: 'bg-green-100 text-green-800',
  frozen: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-slate-100 text-slate-700',
  expired: 'bg-slate-100 text-slate-700',
  depleted: 'bg-slate-100 text-slate-700',
}
const ACTION_LABELS: Record<EntitlementAction, string> = {
  grant: '开通',
  hold: '锁定',
  release: '释放',
  consume: '消耗',
  no_show_consume: '爽约消耗',
  manual_adjust: '人工调整',
}

function creditsText(e: LearnerEntitlement): string {
  if (e.total_credits === null || e.remaining_credits === null) return '不限次'
  return `${e.remaining_credits} / ${e.total_credits}`
}

function fmtDate(s: string): string {
  return s ? s.slice(0, 10) : '—'
}

export function EntitlementsTab({ learnerId }: { learnerId: number }) {
  const { has } = usePermissions()
  const canView = has(PERMISSIONS.ENTITLEMENT_VIEW)
  const canManage = has(PERMISSIONS.ENTITLEMENT_MANAGE)
  const canAdjust = has(PERMISSIONS.ENTITLEMENT_ADJUST)

  const [grantOpen, setGrantOpen] = useState(false)
  const [adjusting, setAdjusting] = useState<LearnerEntitlement | null>(null)
  const [txnsFor, setTxnsFor] = useState<LearnerEntitlement | null>(null)
  const [statusChange, setStatusChange] = useState<{
    e: LearnerEntitlement
    next: EntitlementStatus
  } | null>(null)

  const listQuery = useLearnerEntitlements(canView ? learnerId : null)
  const items = listQuery.data ?? []
  const statusMutation = useSetEntitlementStatus()

  if (!canView) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        无权益查看权限
      </div>
    )
  }

  async function applyStatus() {
    if (!statusChange) return
    try {
      await statusMutation.mutateAsync({ id: statusChange.e.id, status: statusChange.next })
      toast.success('已更新权益状态')
      setStatusChange(null)
    } catch (err) {
      toast.error(err instanceof ApiErrorClass ? err.message : '操作失败')
      setStatusChange(null)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-end">
        <Hint content={canManage ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button size="sm" onClick={() => setGrantOpen(true)} disabled={!canManage} data-testid="entitlement-grant-button">
            <Plus className="mr-1 h-4 w-4" />
            发放权益
          </Button>
        </Hint>
      </div>

      {listQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">加载中...</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">该学员暂无权益</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>产品</TableHead>
              <TableHead>剩余/总</TableHead>
              <TableHead>到期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((e) => {
              const terminal = e.status === 'cancelled'
              const countBased = e.total_credits !== null
              return (
                <TableRow key={e.id} data-testid="entitlement-row" data-id={e.id}>
                  <TableCell className="font-medium">{e.product_name}</TableCell>
                  <TableCell className="text-muted-foreground">{creditsText(e)}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(e.expires_at)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[e.status]}`} data-testid="entitlement-status-badge">
                      {STATUS_LABELS[e.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-3 text-sm">
                      <button
                        type="button"
                        className="text-muted-foreground hover:underline"
                        onClick={() => setTxnsFor(e)}
                        data-testid={`entitlement-txns-${e.id}`}
                      >
                        流水
                      </button>
                      {countBased && !terminal ? (
                        <Hint content={canAdjust ? undefined : PERMISSION_DENIED_TOOLTIP}>
                          <button
                            type="button"
                            className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                            disabled={!canAdjust}
                            onClick={() => setAdjusting(e)}
                            data-testid={`entitlement-adjust-${e.id}`}
                          >
                            调整
                          </button>
                        </Hint>
                      ) : null}
                      {!terminal ? (
                        <>
                          <Hint content={canAdjust ? undefined : PERMISSION_DENIED_TOOLTIP}>
                            <button
                              type="button"
                              className="text-amber-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                              disabled={!canAdjust}
                              onClick={() =>
                                setStatusChange({ e, next: e.status === 'frozen' ? 'active' : 'frozen' })
                              }
                              data-testid={`entitlement-freeze-${e.id}`}
                            >
                              {e.status === 'frozen' ? '恢复' : '冻结'}
                            </button>
                          </Hint>
                          <Hint content={canAdjust ? undefined : PERMISSION_DENIED_TOOLTIP}>
                            <button
                              type="button"
                              className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                              disabled={!canAdjust}
                              onClick={() => setStatusChange({ e, next: 'cancelled' })}
                              data-testid={`entitlement-cancel-${e.id}`}
                            >
                              作废
                            </button>
                          </Hint>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <GrantDialog learnerId={learnerId} open={grantOpen} onOpenChange={setGrantOpen} />
      <AdjustDialog entitlement={adjusting} onClose={() => setAdjusting(null)} />
      <TransactionsDialog entitlement={txnsFor} onClose={() => setTxnsFor(null)} />

      <ConfirmDialog
        open={Boolean(statusChange)}
        title={
          statusChange?.next === 'cancelled'
            ? '作废该权益？'
            : statusChange?.next === 'frozen'
              ? '冻结该权益？'
              : '恢复该权益？'
        }
        description={
          statusChange?.next === 'cancelled'
            ? '作废后该权益不可恢复、不可再用于预约。'
            : statusChange?.next === 'frozen'
              ? '冻结后该权益暂不可用于预约，可随时恢复。'
              : '恢复后该权益可再次用于预约（若未过期/未用完）。'
        }
        confirmText={statusChange?.next === 'cancelled' ? '作废' : statusChange?.next === 'frozen' ? '冻结' : '恢复'}
        destructive={statusChange?.next === 'cancelled'}
        loading={statusMutation.isPending}
        onCancel={() => setStatusChange(null)}
        onConfirm={applyStatus}
      />
    </div>
  )
}

function GrantDialog({
  learnerId,
  open,
  onOpenChange,
}: {
  learnerId: number
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [productId, setProductId] = useState<number>(0)
  const [startsAt, setStartsAt] = useState('')
  const [remark, setRemark] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const grant = useGrantEntitlement()

  const productsQuery = useBrandEntitlementProducts({ status: 'active', page: 1, page_size: 100 }, open)
  const products = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data])

  function reset() {
    setProductId(0)
    setStartsAt('')
    setRemark('')
    setApiError(null)
  }

  async function submit() {
    setApiError(null)
    if (productId <= 0) {
      setApiError('请选择权益产品')
      return
    }
    try {
      await grant.mutateAsync({
        learnerId,
        data: {
          product_id: productId,
          starts_at: startsAt ? new Date(`${startsAt}T00:00:00`).toISOString() : undefined,
          remark: remark || undefined,
        },
      })
      toast.success('权益已发放')
      reset()
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiErrorClass && err.code === ErrorCodes.ENTITLEMENT_PRODUCT_INACTIVE) {
        setApiError('该产品已停用，无法发放')
      } else {
        setApiError(err instanceof ApiErrorClass ? err.message : '发放失败，请重试')
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>发放权益</DialogTitle>
          <DialogDescription>从已启用的权益产品中选择，发放给该学员。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="grant-product">权益产品 *</Label>
            <select
              id="grant-product"
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              data-testid="grant-field-product"
            >
              <option value={0}>请选择产品</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（{p.total_credits === null ? '不限次' : `${p.total_credits}次`} / {p.validity_days}天）
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-starts">生效日期（可选，默认今天）</Label>
            <Input id="grant-starts" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} data-testid="grant-field-starts" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-remark">备注（可选）</Label>
            <Input id="grant-remark" value={remark} onChange={(e) => setRemark(e.target.value)} data-testid="grant-field-remark" />
          </div>
          {apiError ? (
            <p data-testid="api-error" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {apiError}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={grant.isPending}>
            取消
          </Button>
          <Button onClick={submit} disabled={grant.isPending} data-testid="grant-submit">
            {grant.isPending ? '发放中...' : '发放'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AdjustDialog({
  entitlement,
  onClose,
}: {
  entitlement: LearnerEntitlement | null
  onClose: () => void
}) {
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const adjust = useAdjustEntitlement()

  const open = Boolean(entitlement)

  async function submit() {
    setApiError(null)
    const d = Number(delta)
    if (!Number.isInteger(d) || d === 0) {
      setApiError('请输入非 0 的整数')
      return
    }
    if (!reason.trim()) {
      setApiError('请填写调整原因')
      return
    }
    try {
      await adjust.mutateAsync({ id: entitlement!.id, delta: d, reason: reason.trim() })
      toast.success('额度已调整')
      setDelta('')
      setReason('')
      onClose()
    } catch (err) {
      if (err instanceof ApiErrorClass && err.code === ErrorCodes.ENTITLEMENT_INSUFFICIENT) {
        setApiError('调整后剩余次数不能为负')
      } else {
        setApiError(err instanceof ApiErrorClass ? err.message : '调整失败，请重试')
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setDelta('')
          setReason('')
          setApiError(null)
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>调整额度</DialogTitle>
          <DialogDescription>
            {entitlement ? `${entitlement.product_name}：当前剩余 ${entitlement.remaining_credits ?? '—'} 次` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="adjust-delta">增减次数（正数增加，负数扣减）*</Label>
            <Input id="adjust-delta" type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="如 5 或 -2" data-testid="adjust-field-delta" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjust-reason">原因 *</Label>
            <Input id="adjust-reason" value={reason} onChange={(e) => setReason(e.target.value)} data-testid="adjust-field-reason" />
          </div>
          {apiError ? (
            <p data-testid="api-error" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {apiError}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={adjust.isPending}>
            取消
          </Button>
          <Button onClick={submit} disabled={adjust.isPending} data-testid="adjust-submit">
            {adjust.isPending ? '保存中...' : '确认调整'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TransactionsDialog({
  entitlement,
  onClose,
}: {
  entitlement: LearnerEntitlement | null
  onClose: () => void
}) {
  const open = Boolean(entitlement)
  const txnsQuery = useEntitlementTransactions(entitlement?.id ?? null, open)
  const txns = txnsQuery.data ?? []

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>权益流水</DialogTitle>
          <DialogDescription>{entitlement?.product_name}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {txnsQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">加载中...</p>
          ) : txns.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">暂无流水</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>变动</TableHead>
                  <TableHead>余额</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txns.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{ACTION_LABELS[t.action] ?? t.action}</TableCell>
                    <TableCell className={t.delta_credits < 0 ? 'text-destructive' : 'text-green-700'}>
                      {t.delta_credits > 0 ? `+${t.delta_credits}` : t.delta_credits}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.balance_after ?? '—'}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-muted-foreground">{t.note || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{t.created_at.slice(0, 16).replace('T', ' ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
