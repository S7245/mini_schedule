export function StatCard({
  label,
  value,
  hint,
  trend,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint: string
  trend?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}) {
  const toneClass = {
    neutral: 'text-muted-foreground bg-muted',
    success: 'text-green-700 bg-green-100',
    warning: 'text-amber-700 bg-amber-100',
    danger: 'text-red-700 bg-red-100',
  }[tone]

  return (
    <div data-slot="card" className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {trend ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClass}`}>{trend}</span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  )
}
