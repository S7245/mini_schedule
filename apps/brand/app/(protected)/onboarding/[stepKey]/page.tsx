'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  useBrandOnboardingStatus,
  useSkipOnboardingStep,
  useCompleteOnboarding,
} from '@mini-schedule/api/onboarding'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { OnboardingStepKey } from '@mini-schedule/types'
import {
  ONBOARDING_STEP_KEYS,
  ONBOARDING_STEP_ROUTES,
  SKIPPABLE_STEP_KEYS,
  WizardShell,
} from '@/components/onboarding/wizard-shell'
import { StepPlaceholder } from '@/components/onboarding/step-placeholder'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'

const VALID_DYNAMIC_KEYS: OnboardingStepKey[] = [
  'staff',
  'course_category',
  'course_template',
  'entitlement_template',
  'class_session',
  'mini_program_qrcode',
]

function isValidKey(value: string): value is OnboardingStepKey {
  return (VALID_DYNAMIC_KEYS as string[]).includes(value)
}

function nextStepKey(current: OnboardingStepKey): OnboardingStepKey | null {
  const idx = ONBOARDING_STEP_KEYS.indexOf(current)
  if (idx < 0 || idx >= ONBOARDING_STEP_KEYS.length - 1) return null
  return ONBOARDING_STEP_KEYS[idx + 1] ?? null
}

function prevStepKey(current: OnboardingStepKey): OnboardingStepKey | null {
  const idx = ONBOARDING_STEP_KEYS.indexOf(current)
  if (idx <= 0) return null
  return ONBOARDING_STEP_KEYS[idx - 1] ?? null
}

export default function DynamicOnboardingStepPage() {
  const params = useParams()
  const router = useRouter()
  const rawKey = String(params.stepKey ?? '')
  const statusQuery = useBrandOnboardingStatus()
  const skipMutation = useSkipOnboardingStep()
  const completeMutation = useCompleteOnboarding()
  const [confirmSkip, setConfirmSkip] = useState(false)

  if (!isValidKey(rawKey)) {
    return (
      <WizardShell
        currentStepKey="staff"
        steps={statusQuery.data?.steps ?? []}
        title="未知步骤"
        description="该步骤不存在或链接已失效。"
      >
        <div className="py-10 text-center">
          <Button onClick={() => router.replace('/onboarding')}>返回开始</Button>
        </div>
      </WizardShell>
    )
  }

  const stepKey: OnboardingStepKey = rawKey
  const steps = statusQuery.data?.steps ?? []
  const current = steps.find((s) => s.step_key === stepKey)
  const isSkippable = SKIPPABLE_STEP_KEYS.has(stepKey)
  const prev = prevStepKey(stepKey)
  const next = nextStepKey(stepKey)
  const allDone = steps.length > 0 &&
    steps.every((s) => s.status === 'completed' || s.status === 'skipped')

  async function handleSkip() {
    try {
      await skipMutation.mutateAsync({ stepKey })
      toast.success('已跳过此步')
      setConfirmSkip(false)
      // If this was the last unfinished step, try complete; else move to next
      const refreshed = await statusQuery.refetch()
      const newSteps = refreshed.data?.steps ?? []
      const stillPending = newSteps.find(
        (s) => s.status !== 'completed' && s.status !== 'skipped',
      )
      if (!stillPending) {
        router.push('/onboarding/complete')
      } else if (next) {
        router.push(ONBOARDING_STEP_ROUTES[next])
      }
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === ErrorCodes.STEP_NOT_SKIPPABLE) {
          toast.error('此步骤不允许跳过')
        } else {
          toast.error(err.message || '跳过失败')
        }
      } else {
        toast.error('跳过失败')
      }
      setConfirmSkip(false)
    }
  }

  async function handleComplete() {
    try {
      await completeMutation.mutateAsync()
      router.push('/onboarding/complete')
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        toast.error(err.message || '完成失败')
      }
    }
  }

  return (
    <WizardShell
      currentStepKey={stepKey}
      steps={steps}
      title={`第 ${ONBOARDING_STEP_KEYS.indexOf(stepKey) + 1} 步 · ${stepKey}`}
      description="该模块尚未上线，可先跳过此步，完成开通后再补充。"
      footer={
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={!prev}
            onClick={() => prev && router.push(ONBOARDING_STEP_ROUTES[prev])}
          >
            上一步
          </Button>
          <div className="flex gap-2">
            {isSkippable ? (
              <Button
                variant="ghost"
                onClick={() => setConfirmSkip(true)}
                disabled={skipMutation.isPending || current?.status === 'skipped'}
                data-testid={`skip-step-${stepKey}`}
              >
                {current?.status === 'skipped' ? '已跳过' : '跳过此步'}
              </Button>
            ) : null}
            {allDone ? (
              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                data-testid="complete-onboarding-button"
              >
                {completeMutation.isPending ? '提交中...' : '完成开通'}
              </Button>
            ) : (
              <Button
                disabled={!next}
                onClick={() => next && router.push(ONBOARDING_STEP_ROUTES[next])}
              >
                下一步
              </Button>
            )}
          </div>
        </div>
      }
    >
      <StepPlaceholder stepKey={stepKey} />

      <ConfirmDialog
        open={confirmSkip}
        title="跳过此步？"
        description="跳过后仍计入开通完成度，可在工作台随时回到向导补做。"
        confirmText="跳过"
        loading={skipMutation.isPending}
        onCancel={() => setConfirmSkip(false)}
        onConfirm={handleSkip}
      />
    </WizardShell>
  )
}
