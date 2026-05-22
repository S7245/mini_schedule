import type { ReactNode } from 'react'

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-card/92 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:px-5">
      {children}
    </div>
  )
}
