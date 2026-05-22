import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function SectionCard({
  title,
  description,
  children,
  className = '',
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border/80 bg-card/96 p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)] backdrop-blur',
        className,
      )}
    >
      <div className="mb-4">
        <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  )
}
