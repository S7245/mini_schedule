import type { ReactNode } from 'react'

interface ProtectedLayoutProps {
  children: ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <>{children}</>
}
