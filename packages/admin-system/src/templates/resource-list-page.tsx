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
      <section className="overflow-hidden rounded-xl border border-border/80 bg-card/96 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur">
        {content}
        {footer ? <div className="border-t border-border/70">{footer}</div> : null}
      </section>
    </div>
  )
}
