'use client'

import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import type { OnboardingStepKey } from '@mini-schedule/types'
import { ONBOARDING_STEP_LABELS } from './wizard-shell'

export interface StepPlaceholderProps {
  stepKey: OnboardingStepKey
  hint?: string
  actions?: ReactNode
}

const STEP_HINTS: Partial<Record<OnboardingStepKey, string>> = {
  course_category: '课程分类用于组织课程模板，将在后续版本支持。',
  course_template: '课程模板用于排课，将在后续版本支持。',
  entitlement_template: '学员权益模板用于售卖会员卡 / 课包，将在后续版本支持。',
  class_session: '场次排课将在后续版本支持，可先跳过此步。',
  mini_program_qrcode: '小程序入口与二维码将在后续版本支持，可先跳过此步。',
}

export function StepPlaceholder({ stepKey, hint, actions }: StepPlaceholderProps) {
  const label = ONBOARDING_STEP_LABELS[stepKey]
  return (
    <div
      data-testid="onboarding-step-placeholder"
      data-step-key={stepKey}
      className="flex flex-col items-center justify-center gap-4 py-10 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">{label} · 敬请期待</p>
        <p className="text-sm text-muted-foreground">
          {hint ?? STEP_HINTS[stepKey] ?? '该模块即将上线，可先跳过此步。'}
        </p>
      </div>
      {actions ? <div className="mt-2">{actions}</div> : null}
    </div>
  )
}
