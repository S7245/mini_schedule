import type { ReactNode } from 'react'

export function DataTable({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto px-2 py-2 sm:px-3">{children}</div>
}
