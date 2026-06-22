'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useBookingPolicy, useUpsertBookingPolicy } from '@mini-schedule/api/booking-policy'
import { ApiErrorClass } from '@mini-schedule/api/errors'
import type { BookingPolicy } from '@mini-schedule/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Hint } from '@/components/ui/hint'
import { Card } from '@/components/ui/card'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const DENIED = '权限不足，请联系管理员'

// 表单内部把可空限额存为字符串，空串 = 不限（null）。
interface FormState {
  book_ahead_min_minutes: string
  book_ahead_max_minutes: string
  cancel_deadline_minutes: string
  release_on_cancel: boolean
  no_show_consumes_entitlement: boolean
  daily_booking_limit: string
  weekly_booking_limit: string
  concurrent_booking_limit: string
  allow_waitlist: boolean
  waitlist_limit: string
}

function toForm(p: BookingPolicy): FormState {
  const n = (v: number | null) => (v === null ? '' : String(v))
  return {
    book_ahead_min_minutes: String(p.book_ahead_min_minutes),
    book_ahead_max_minutes: n(p.book_ahead_max_minutes),
    cancel_deadline_minutes: String(p.cancel_deadline_minutes),
    release_on_cancel: p.release_on_cancel,
    no_show_consumes_entitlement: p.no_show_consumes_entitlement,
    daily_booking_limit: n(p.daily_booking_limit),
    weekly_booking_limit: n(p.weekly_booking_limit),
    concurrent_booking_limit: n(p.concurrent_booking_limit),
    allow_waitlist: p.allow_waitlist,
    waitlist_limit: String(p.waitlist_limit),
  }
}

function toPayload(f: FormState): BookingPolicy {
  const opt = (v: string) => (v.trim() === '' ? null : Number(v))
  const req = (v: string) => (v.trim() === '' ? 0 : Number(v))
  return {
    book_ahead_min_minutes: req(f.book_ahead_min_minutes),
    book_ahead_max_minutes: opt(f.book_ahead_max_minutes),
    cancel_deadline_minutes: req(f.cancel_deadline_minutes),
    release_on_cancel: f.release_on_cancel,
    no_show_consumes_entitlement: f.no_show_consumes_entitlement,
    daily_booking_limit: opt(f.daily_booking_limit),
    weekly_booking_limit: opt(f.weekly_booking_limit),
    concurrent_booking_limit: opt(f.concurrent_booking_limit),
    allow_waitlist: f.allow_waitlist,
    waitlist_limit: req(f.waitlist_limit),
  }
}

export default function BookingPolicyPage() {
  const { has } = usePermissions()
  const canEdit = has(PERMISSIONS.SCHEDULE_MANAGE)

  const policyQuery = useBookingPolicy()
  const upsert = useUpsertBookingPolicy()
  const [form, setForm] = useState<FormState | null>(null)

  useEffect(() => {
    if (policyQuery.data) setForm(toForm(policyQuery.data))
  }, [policyQuery.data])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  async function onSave() {
    if (!form) return
    try {
      await upsert.mutateAsync(toPayload(form))
      toast.success('预约规则已保存')
    } catch (err) {
      toast.error(err instanceof ApiErrorClass ? err.message : '保存失败，请重试')
    }
  }

  const numField = (
    key: keyof FormState,
    label: string,
    hint?: string,
  ) => (
    <div className="space-y-1">
      <Label htmlFor={`policy-${key}`}>{label}</Label>
      <Input
        id={`policy-${key}`}
        type="number"
        min={0}
        value={(form?.[key] as string) ?? ''}
        onChange={(e) => set(key, e.target.value as FormState[typeof key])}
        disabled={!canEdit}
        data-testid={`policy-${key}`}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )

  const checkField = (key: keyof FormState, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={Boolean(form?.[key])}
        onChange={(e) => set(key, e.target.checked as FormState[typeof key])}
        disabled={!canEdit}
        data-testid={`policy-${key}`}
      />
      {label}
    </label>
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">预约规则</h1>
        <p className="text-sm text-muted-foreground">
          品牌默认预约规则（适用于所有门店；门店级 / 场次级覆盖将在后续批次开放）。
        </p>
      </div>

      {policyQuery.isLoading || !form ? (
        <p className="text-sm text-muted-foreground">加载中...</p>
      ) : (
        <Card className="max-w-2xl space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {numField('book_ahead_min_minutes', '最少提前预约（分钟）', '0 = 开课前都可约')}
            {numField('book_ahead_max_minutes', '最多提前预约（分钟）', '留空 = 不限')}
            {numField('cancel_deadline_minutes', '最晚取消（开课前分钟）', '0 = 开课前都可取消')}
            {numField('daily_booking_limit', '每日预约上限', '留空 = 不限')}
            {numField('weekly_booking_limit', '每周预约上限', '留空 = 不限')}
            {numField('concurrent_booking_limit', '同时未完成预约上限', '留空 = 不限')}
            {numField('waitlist_limit', '候补上限', '候补逻辑在 13d 开放')}
          </div>
          <div className="space-y-3 border-t border-slate-100 pt-4">
            {checkField('release_on_cancel', '取消后释放权益（退还课时）')}
            {checkField('no_show_consumes_entitlement', '爽约扣课时（签到批次 13e 生效）')}
            {checkField('allow_waitlist', '允许候补（13d 开放）')}
          </div>
          <div className="flex justify-end">
            <Hint content={canEdit ? undefined : DENIED}>
              <Button onClick={onSave} disabled={!canEdit || upsert.isPending} data-testid="policy-save">
                {upsert.isPending ? '保存中...' : '保存'}
              </Button>
            </Hint>
          </div>
        </Card>
      )}
    </div>
  )
}
