'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useBrandLearner } from '@mini-schedule/api/learners'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import { LearnerFormDialog } from '@/components/learners/learner-form-dialog'
import { EntitlementsTab } from '@/components/learners/entitlements-tab'
import { BookingsTab } from '@/components/learners/bookings-tab'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const STATUS_LABELS: Record<string, string> = {
  active: '正常',
  frozen: '已冻结',
  inactive: '已停用',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  frozen: 'bg-amber-100 text-amber-800',
  inactive: 'bg-slate-100 text-slate-700',
}

// Tab 配置：entitlements（13b）+ bookings（13c）已落地，records 仍占位（13e）。
const TABS: { key: string; label: string; hint?: string }[] = [
  { key: 'entitlements', label: '权益' },
  { key: 'bookings', label: '预约' },
  { key: 'records', label: '履约记录', hint: '上课/履约记录将在签到批次（13e）上线' },
]

export default function LearnerDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const { has } = usePermissions()
  const canEdit = has(PERMISSIONS.LEARNER_EDIT)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('entitlements')

  const learnerQuery = useBrandLearner(Number.isFinite(id) ? id : null)
  const learner = learnerQuery.data
  const locationsQuery = useBrandLocations(1, 100, 'active')
  const locations = useMemo(
    () => locationsQuery.data?.items ?? [],
    [locationsQuery.data],
  )

  return (
    <div className="space-y-6 p-6">
      <Link
        href="/learners"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回学员列表
      </Link>

      {learnerQuery.isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">加载中...</p>
      ) : !learner ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          学员不存在或无权访问
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">
                {learner.nickname || '（未填昵称）'}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_BADGE[learner.status] ?? ''
                }`}
                data-testid="learner-detail-status"
              >
                {STATUS_LABELS[learner.status] ?? learner.status}
              </span>
            </div>
            <Hint content={canEdit ? undefined : '权限不足，请联系管理员'}>
              <Button
                variant="outline"
                disabled={!canEdit}
                onClick={() => setDialogOpen(true)}
                data-testid="learner-detail-edit"
              >
                编辑资料
              </Button>
            </Hint>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              基础信息
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="手机号" value={learner.phone} />
              <Field label="学号" value={learner.learner_no || '—'} />
              <Field label="主门店" value={learner.primary_location_name || '—'} />
              <Field
                label="标签"
                value={
                  learner.tags.length === 0 ? (
                    '—'
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {learner.tags.map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )
                }
              />
              <Field label="备注" value={learner.remark || '—'} />
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex gap-1 border-b border-slate-200 px-4">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                    activeTab === tab.key
                      ? 'border-primary font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`learner-tab-${tab.key}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === 'entitlements' ? (
              <EntitlementsTab learnerId={learner.id} />
            ) : activeTab === 'bookings' ? (
              <BookingsTab learnerId={learner.id} />
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {TABS.find((t) => t.key === activeTab)?.hint}
              </div>
            )}
          </div>

          <LearnerFormDialog
            open={dialogOpen}
            initial={learner}
            locations={locations}
            onOpenChange={setDialogOpen}
          />
        </>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  )
}
