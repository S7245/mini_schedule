'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { OnboardingStep, OnboardingStepKey, OnboardingStepStatus } from '@mini-schedule/types'

export const ONBOARDING_STEP_KEYS: OnboardingStepKey[] = [
  'brand_profile',
  'location',
  'staff',
  'course_category',
  'course_template',
  'entitlement_template',
  'class_session',
  'mini_program_qrcode',
]

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepKey, string> = {
  brand_profile: '完善品牌资料',
  location: '创建门店',
  staff: '添加员工',
  course_category: '课程分类',
  course_template: '创建课程',
  entitlement_template: '权益模板',
  class_session: '排第一节课',
  mini_program_qrcode: '小程序入口',
}

export const ONBOARDING_STEP_ROUTES: Record<OnboardingStepKey, string> = {
  brand_profile: '/onboarding/brand-profile',
  location: '/onboarding/locations',
  staff: '/onboarding/staff',
  course_category: '/onboarding/course_category',
  course_template: '/onboarding/course_template',
  entitlement_template: '/onboarding/entitlement_template',
  class_session: '/onboarding/class_session',
  mini_program_qrcode: '/onboarding/mini_program_qrcode',
}

export const SKIPPABLE_STEP_KEYS: ReadonlySet<OnboardingStepKey> = new Set([
  'staff',
  'course_category',
  'course_template',
  'entitlement_template',
  'class_session',
  'mini_program_qrcode',
])

export interface WizardShellProps {
  currentStepKey: OnboardingStepKey
  steps: OnboardingStep[]
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

function bubbleClasses(state: OnboardingStepStatus, isCurrent: boolean): string {
  if (state === 'completed') {
    return 'bg-primary text-primary-foreground border-primary'
  }
  if (state === 'skipped') {
    return 'bg-slate-200 text-slate-500 border-slate-200'
  }
  if (isCurrent) {
    return 'border-2 border-primary bg-white text-primary'
  }
  return 'border-2 border-slate-200 bg-white text-slate-400'
}

function bubbleContent(state: OnboardingStepStatus, index: number): ReactNode {
  if (state === 'completed') return <Check className="h-3 w-3" aria-label="completed" />
  if (state === 'skipped') return <Check className="h-3 w-3 opacity-60" aria-label="skipped" />
  return index + 1
}

export function WizardShell({
  currentStepKey,
  steps,
  title,
  description,
  children,
  footer,
}: WizardShellProps) {
  const stepMap = new Map<OnboardingStepKey, OnboardingStep>(
    steps.map((s) => [s.step_key, s]),
  )
  const totalSteps = ONBOARDING_STEP_KEYS.length
  const completedCount = steps.filter(
    (s) => s.status === 'completed' || s.status === 'skipped',
  ).length
  const currentIndex = ONBOARDING_STEP_KEYS.indexOf(currentStepKey)

  return (
    <div className="flex min-h-full flex-col items-center bg-slate-50 px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          品牌开通向导
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          完成下列步骤，开启你的品牌运营
        </p>
      </div>

      <div
        className="mb-6 flex w-full max-w-3xl items-center"
        data-testid="onboarding-progress"
      >
        {ONBOARDING_STEP_KEYS.map((key, i) => {
          const step = stepMap.get(key)
          const status = step?.status ?? 'not_started'
          const isCurrent = key === currentStepKey
          return (
            <div key={key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  data-testid={`onboarding-step-${key}`}
                  data-status={status}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${bubbleClasses(
                    status,
                    isCurrent,
                  )}`}
                >
                  {bubbleContent(status, i)}
                </div>
                <span
                  className={`mt-1 max-w-[5rem] truncate text-center text-[11px] ${
                    isCurrent ? 'font-semibold text-primary' : 'text-slate-400'
                  }`}
                  title={ONBOARDING_STEP_LABELS[key]}
                >
                  {ONBOARDING_STEP_LABELS[key]}
                </span>
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`mx-1 mb-4 h-px flex-1 ${
                    status === 'completed' || status === 'skipped'
                      ? 'bg-primary'
                      : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <span
            data-testid="onboarding-progress-label"
            className="text-sm font-medium text-muted-foreground"
          >
            {Math.max(currentIndex + 1, 1)}/{totalSteps}（已完成 {completedCount}/
            {totalSteps}）
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {children}
        </div>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  )
}
