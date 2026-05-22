import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-foreground lg:text-[2.4rem]">{title}</h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground lg:text-[0.95rem]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2 self-start lg:self-auto">{actions}</div> : null}
    </div>
  )
}
