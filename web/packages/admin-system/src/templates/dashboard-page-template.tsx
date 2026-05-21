import type { ReactNode } from 'react'

export function DashboardPageTemplate({
  header,
  stats,
  primary,
  secondary
}: {
  header: ReactNode
  stats: ReactNode
  primary: ReactNode
  secondary: ReactNode
}) {
  return (
    <div className="space-y-5 lg:space-y-6">
      {header}
      {stats}
      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,1.45fr),minmax(320px,0.8fr)]">
        <section className="min-w-0 space-y-4 lg:space-y-6">{primary}</section>
        <aside className="min-w-0 space-y-4 lg:space-y-6">{secondary}</aside>
      </div>
    </div>
  )
}
