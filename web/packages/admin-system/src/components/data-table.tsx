import type { ReactNode } from 'react'

export function DataTable({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>
}
