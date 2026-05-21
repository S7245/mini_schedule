import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6', className)}>
      {children}
    </div>
  )
}
