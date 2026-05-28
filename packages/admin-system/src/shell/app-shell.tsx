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
  const insetSidebar = preferences.sidebarStyle === 'inset'
  const sidebarOffset = desktopSidebarHidden
    ? 'md:pl-0'
    : sidebarCollapsed
      ? floatingSidebar
        ? 'md:pl-[5.25rem]'
        : insetSidebar
          ? 'md:pl-[4.5rem]'
          : 'md:pl-[4.5rem]'
      : floatingSidebar
        ? 'md:pl-[17.5rem]'
        : insetSidebar
          ? 'md:pl-[17rem]'
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
        'min-h-svh text-foreground [--shell-page-bg:var(--color-background)] [--shell-panel-bg:var(--color-card)] [--shell-sidebar-shadow:0_16px_48px_rgba(15,23,42,0.08)]',
        insetSidebar ? 'bg-sidebar' : 'bg-background',
        'data-[font=geist]:font-[family-name:var(--font-geist,Inter)] data-[font=inter]:font-sans',
        'data-[theme-preset=graphite]:[--color-primary:#111111] data-[theme-preset=graphite]:[--color-primary-foreground:#ffffff] data-[theme-preset=graphite]:[--color-ring:#111111]',
        'data-[theme-preset=ocean]:[--color-primary:#111111] data-[theme-preset=ocean]:[--color-primary-foreground:#ffffff] data-[theme-preset=ocean]:[--color-ring:#111111]',
      )}
    >
      {sidebar}
      <div
        className={cn(
          'flex min-h-svh min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-linear',
          sidebarOffset,
          insetSidebar && 'md:py-2 md:pr-2',
        )}
      >
        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col',
            insetSidebar && 'md:min-h-[calc(100svh-1rem)] md:overflow-clip md:rounded-xl md:border md:border-border md:bg-background md:shadow-sm',
          )}
        >
          {topbar}
          <main className="flex-1 bg-background">{children}</main>
        </div>
      </div>
    </div>
  )
}
