import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { PageLayout } from './preferences'

interface PageContainerProps {
  children: ReactNode
  className?: string
  pageLayout?: PageLayout
}

export function PageContainer({ children, className, pageLayout = 'centered' }: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6',
        pageLayout === 'centered' ? 'mx-auto max-w-screen-2xl' : 'max-w-none',
        className,
      )}
    >
      {children}
    </div>
  )
}
