import type { ReactNode } from 'react'

export function ResourceListPage({
  header,
  filters,
  content,
  footer
}: {
  header: ReactNode
  filters?: ReactNode
  content: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="space-y-6">
      {header}
      {filters}
      <section className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
        {content}
        {footer ? <div className="border-t border-border/70">{footer}</div> : null}
      </section>
    </div>
  )
}
