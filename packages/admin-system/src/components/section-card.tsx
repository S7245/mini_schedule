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
        'rounded-xl bg-card py-4 text-card-foreground shadow-sm ring-1 ring-foreground/10',
        className,
      )}
    >
      <div className="mb-4 px-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="px-4 text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  )
}
