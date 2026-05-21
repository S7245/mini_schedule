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
    <div className="space-y-5 lg:space-y-6">
      {header}
      {filters}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">{content}</div>
      {footer}
    </div>
  )
}
