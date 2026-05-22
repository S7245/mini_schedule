import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { ShellPreferences } from './preferences'

interface AppShellProps {
  sidebar: ReactNode
  topbar: ReactNode
  children: ReactNode
  preferences: ShellPreferences
  sidebarCollapsed?: boolean
  desktopSidebarHidden?: boolean
}

export function AppShell({
  sidebar,
  topbar,
  children,
  preferences,
  sidebarCollapsed = false,
  desktopSidebarHidden = false,
}: AppShellProps) {
  const floatingSidebar = preferences.sidebarStyle === 'floating'
  const sidebarOffset = desktopSidebarHidden
    ? 'md:pl-0'
    : sidebarCollapsed
      ? floatingSidebar
        ? 'md:pl-[5.25rem]'
        : 'md:pl-[4.5rem]'
      : floatingSidebar
        ? 'md:pl-[17.5rem]'
        : 'md:pl-[17rem]'

  return (
    <div
      data-font={preferences.font}
      data-navbar-behavior={preferences.navbarBehavior}
      data-page-layout={preferences.pageLayout}
      data-sidebar-style={preferences.sidebarStyle}
      data-sidebar-collapse-mode={preferences.sidebarCollapseMode}
      data-theme-preset={preferences.themePreset}
      className={cn(
        'min-h-screen bg-background text-foreground [--shell-page-bg:var(--color-background)] [--shell-panel-bg:var(--color-card)] [--shell-sidebar-shadow:0_16px_48px_rgba(15,23,42,0.08)]',
        'data-[font=geist]:font-[family-name:var(--font-geist,Inter)] data-[font=inter]:font-sans',
        'data-[theme-preset=graphite]:[--color-primary:#111111] data-[theme-preset=graphite]:[--color-primary-foreground:#ffffff] data-[theme-preset=graphite]:[--color-ring:#111111]',
        'data-[theme-preset=ocean]:[--color-primary:#111111] data-[theme-preset=ocean]:[--color-primary-foreground:#ffffff] data-[theme-preset=ocean]:[--color-ring:#111111]',
      )}
    >
      {sidebar}
      <div
        className={cn(
          'flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-linear',
          sidebarOffset,
        )}
      >
        {topbar}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  )
}
