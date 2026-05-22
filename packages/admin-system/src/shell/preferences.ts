export type ThemePreset = 'default' | 'graphite' | 'ocean'
export type FontOption = 'inter' | 'geist'
export type ThemeMode = 'light' | 'dark' | 'system'
export type PageLayout = 'centered' | 'full-width'
export type NavbarBehavior = 'sticky' | 'scroll'
export type SidebarStyle = 'inset' | 'sidebar' | 'floating'
export type SidebarCollapseMode = 'icon' | 'offcanvas'

export interface ShellPreferences {
  themePreset: ThemePreset
  font: FontOption
  themeMode: ThemeMode
  pageLayout: PageLayout
  navbarBehavior: NavbarBehavior
  sidebarStyle: SidebarStyle
  sidebarCollapseMode: SidebarCollapseMode
}

export const SHELL_PREFERENCES_STORAGE_KEY = 'mini_schedule_shell_preferences'

export const SHELL_PREFERENCE_DEFAULTS: ShellPreferences = {
  themePreset: 'default',
  font: 'geist',
  themeMode: 'light',
  pageLayout: 'full-width',
  navbarBehavior: 'sticky',
  sidebarStyle: 'inset',
  sidebarCollapseMode: 'icon',
}

export const THEME_PRESET_OPTIONS: Array<{ value: ThemePreset; label: string; swatchClassName: string }> = [
  { value: 'default', label: 'Default', swatchClassName: 'bg-[var(--primary)]' },
  { value: 'graphite', label: 'Graphite', swatchClassName: 'bg-[#464f63]' },
  { value: 'ocean', label: 'Ocean', swatchClassName: 'bg-[#2b7fff]' },
]

export const FONT_OPTIONS: Array<{ value: FontOption; label: string }> = [
  { value: 'geist', label: 'Geist' },
  { value: 'inter', label: 'Inter' },
]

export function getInitials(label: string) {
  const parts = label
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return 'MS'
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export function parseShellPreferences(rawValue: string | null | undefined): ShellPreferences {
  if (!rawValue) return SHELL_PREFERENCE_DEFAULTS

  try {
    const parsed = JSON.parse(rawValue) as Partial<ShellPreferences>

    return {
      themePreset: isOneOf(parsed.themePreset, ['default', 'graphite', 'ocean'])
        ? parsed.themePreset
        : SHELL_PREFERENCE_DEFAULTS.themePreset,
      font: isOneOf(parsed.font, ['inter', 'geist']) ? parsed.font : SHELL_PREFERENCE_DEFAULTS.font,
      themeMode: isOneOf(parsed.themeMode, ['light', 'dark', 'system'])
        ? parsed.themeMode
        : SHELL_PREFERENCE_DEFAULTS.themeMode,
      pageLayout: isOneOf(parsed.pageLayout, ['centered', 'full-width'])
        ? parsed.pageLayout
        : SHELL_PREFERENCE_DEFAULTS.pageLayout,
      navbarBehavior: isOneOf(parsed.navbarBehavior, ['sticky', 'scroll'])
        ? parsed.navbarBehavior
        : SHELL_PREFERENCE_DEFAULTS.navbarBehavior,
      sidebarStyle: isOneOf(parsed.sidebarStyle, ['inset', 'sidebar', 'floating'])
        ? parsed.sidebarStyle
        : SHELL_PREFERENCE_DEFAULTS.sidebarStyle,
      sidebarCollapseMode: isOneOf(parsed.sidebarCollapseMode, ['icon', 'offcanvas'])
        ? parsed.sidebarCollapseMode
        : SHELL_PREFERENCE_DEFAULTS.sidebarCollapseMode,
    }
  } catch {
    return SHELL_PREFERENCE_DEFAULTS
  }
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}
