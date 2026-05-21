import type { ReactNode } from 'react'

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
    <section className={`rounded-lg border border-border bg-card p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  )
}
