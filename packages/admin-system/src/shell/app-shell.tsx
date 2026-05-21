import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface AppShellProps {
  sidebar: ReactNode
  topbar: ReactNode
  children: ReactNode
  sidebarCollapsed?: boolean
}

export function AppShell({ sidebar, topbar, children, sidebarCollapsed = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {sidebar}
      <div
        className={cn(
          'flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-linear md:pl-72',
          sidebarCollapsed && 'md:pl-20'
        )}
      >
        {topbar}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
