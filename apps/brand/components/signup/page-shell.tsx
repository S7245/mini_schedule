import React from 'react'

export const steps = ['注册信息', '选择套餐', '扫码支付']

export function PageShell({
  currentStep = 2,
  children,
}: {
  currentStep?: number
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-50 px-4 py-12">
      {/* 品牌标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mini Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">课程预约 SaaS 平台</p>
      </div>

      {/* 步骤进度条 */}
      <div className="mb-8 flex w-full max-w-md items-center">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  i < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : i === currentStep
                      ? 'border-2 border-primary bg-white text-primary'
                      : 'border-2 border-slate-200 bg-white text-slate-400'
                }`}
              >
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span
                className={`mt-1 text-xs ${i === currentStep ? 'font-semibold text-primary' : 'text-slate-400'}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 mb-4 h-px flex-1 ${i < currentStep ? 'bg-primary' : 'bg-slate-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 内容卡片 */}
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
