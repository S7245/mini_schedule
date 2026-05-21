# Admin + Brand Backoffice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a shared `packages/admin-system` package, migrate `apps/admin` to the first complete backoffice shell and dashboard experience, then reuse the same shell and login system in `apps/brand`.

**Architecture:** Keep business routes, auth rules, and API hooks inside each app while moving shared shell, page templates, and admin-oriented UI blocks into `packages/admin-system`. Land the system in `admin` first, then migrate `brand` to the same shell so both apps share one backoffice language without affecting `apps/app`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, pnpm workspace, Tailwind CSS, shadcn/ui primitives, Zustand auth store, TanStack Query.

---

## File Map

### Existing files to modify

- `apps/admin/package.json`
  - Add `@mini-schedule/admin-system` workspace dependency.
- `apps/brand/package.json`
  - Add `@mini-schedule/admin-system` workspace dependency.
- `apps/admin/app/(protected)/layout.tsx`
  - Replace the app-local protected wrapper with app-level guard + shared protected shell composition.
- `apps/admin/app/(protected)/dashboard/page.tsx`
  - Replace the primitive card row with shared dashboard page template composition.
- `apps/admin/app/(protected)/brands/page.tsx`
  - Replace ad hoc header/table layout with `ResourceListPage`, `PageHeader`, `StatusBadge`, and `DataTable`.
- `apps/admin/app/(protected)/admins/page.tsx`
  - Replace ad hoc header/table layout with the same list-page system.
- `apps/admin/app/(auth)/login/page.tsx`
  - Keep login logic, but render it inside `LoginShell`.
- `apps/brand/app/(protected)/layout.tsx`
  - Compose app-level guard with shared protected shell.
- `apps/brand/app/(protected)/dashboard/page.tsx`
  - Move to the shared dashboard template.
- `apps/brand/app/(auth)/login/page.tsx`
  - Keep form logic, but render it inside `LoginShell`.
- `apps/admin/middleware.ts`
  - Keep route-guard scope limited to admin app access decisions.
- `apps/brand/middleware.ts`
  - Keep route-guard scope limited to brand app access decisions.
- `tsconfig.base.json`
  - Add path alias for `@mini-schedule/admin-system/*` if workspace resolution needs local TS awareness.

### Existing files to delete after migration

- `apps/admin/components/layout/protected-layout.tsx`
  - Superseded by shared shell and app-specific guard composition.
- `apps/brand/components/layout/sidebar.tsx`
  - Superseded by shared shell and app-specific nav config.

### New package files to create

- `packages/admin-system/package.json`
  - Workspace package definition and exports.
- `packages/admin-system/tsconfig.json`
  - Package TS settings.
- `packages/admin-system/src/index.ts`
  - Top-level re-exports.
- `packages/admin-system/src/models/nav.ts`
  - Shared navigation types.
- `packages/admin-system/src/models/page-meta.ts`
  - Shared page metadata and action types.
- `packages/admin-system/src/shell/app-shell.tsx`
  - Core backoffice frame.
- `packages/admin-system/src/shell/sidebar.tsx`
  - Generic sidebar driven by nav config.
- `packages/admin-system/src/shell/topbar.tsx`
  - Top navigation, breadcrumbs, and right-side actions.
- `packages/admin-system/src/shell/page-container.tsx`
  - Content width and spacing wrapper.
- `packages/admin-system/src/shell/protected-app-layout.tsx`
  - Shared protected area shell.
- `packages/admin-system/src/templates/dashboard-page-template.tsx`
  - Standard dashboard page composition.
- `packages/admin-system/src/templates/resource-list-page.tsx`
  - Standard list page composition.
- `packages/admin-system/src/templates/login-shell.tsx`
  - Shared auth entry shell.
- `packages/admin-system/src/components/page-header.tsx`
  - Title, description, breadcrumb, action area.
- `packages/admin-system/src/components/stat-card.tsx`
  - Reusable dashboard metric card.
- `packages/admin-system/src/components/section-card.tsx`
  - Shared framed content section.
- `packages/admin-system/src/components/status-badge.tsx`
  - Shared status visual language.
- `packages/admin-system/src/components/filter-bar.tsx`
  - Shared filter/action row.
- `packages/admin-system/src/components/data-table.tsx`
  - Shared table wrapper around current shadcn table primitives.
- `packages/admin-system/src/components/empty-state.tsx`
  - Shared empty state.
- `packages/admin-system/src/components/loading-state.tsx`
  - Shared loading placeholder.

---

### Task 1: Create the `@mini-schedule/admin-system` package

**Files:**
- Create: `packages/admin-system/package.json`
- Create: `packages/admin-system/tsconfig.json`
- Create: `packages/admin-system/src/index.ts`
- Create: `packages/admin-system/src/models/nav.ts`
- Create: `packages/admin-system/src/models/page-meta.ts`
- Modify: `tsconfig.base.json`
- Modify: `apps/admin/package.json`
- Modify: `apps/brand/package.json`

- [ ] **Step 1: Add the new workspace package manifest**

Create `packages/admin-system/package.json`:

```json
{
  "name": "@mini-schedule/admin-system",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./models/nav": "./src/models/nav.ts",
    "./models/page-meta": "./src/models/page-meta.ts",
    "./shell/app-shell": "./src/shell/app-shell.tsx",
    "./shell/protected-app-layout": "./src/shell/protected-app-layout.tsx",
    "./templates/dashboard-page-template": "./src/templates/dashboard-page-template.tsx",
    "./templates/resource-list-page": "./src/templates/resource-list-page.tsx",
    "./templates/login-shell": "./src/templates/login-shell.tsx"
  },
  "peerDependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.469.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Add TypeScript configuration for the package**

Create `packages/admin-system/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Define shared nav and page metadata models**

Create `packages/admin-system/src/models/nav.ts`:

```ts
import type { ReactNode } from 'react'

export interface BackofficeNavItem {
  href: string
  label: string
  icon?: ReactNode
  badge?: string
}
```

Create `packages/admin-system/src/models/page-meta.ts`:

```ts
import type { ReactNode } from 'react'

export interface PageAction {
  key: string
  label: string
  icon?: ReactNode
}

export interface BreadcrumbItem {
  href?: string
  label: string
}
```

- [ ] **Step 4: Create the first package export surface**

Create `packages/admin-system/src/index.ts`:

```ts
export * from './models/nav'
export * from './models/page-meta'
```

- [ ] **Step 5: Wire TypeScript and workspace consumers**

Modify `tsconfig.base.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@mini-schedule/config/*": ["./packages/config/src/*"],
      "@mini-schedule/admin-system/*": ["./packages/admin-system/src/*"]
    }
  }
}
```

Modify `apps/admin/package.json` dependencies:

```json
{
  "dependencies": {
    "@mini-schedule/admin-system": "workspace:*"
  }
}
```

Modify `apps/brand/package.json` dependencies:

```json
{
  "dependencies": {
    "@mini-schedule/admin-system": "workspace:*"
  }
}
```

- [ ] **Step 6: Verify the workspace can resolve the new package**

Run:

```bash
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web install
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/admin exec tsc --noEmit
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/brand exec tsc --noEmit
```

Expected:

- install completes without workspace resolution errors
- both TypeScript commands pass

---

### Task 2: Extract the shared protected shell and migrate `admin`

**Files:**
- Create: `packages/admin-system/src/shell/app-shell.tsx`
- Create: `packages/admin-system/src/shell/sidebar.tsx`
- Create: `packages/admin-system/src/shell/topbar.tsx`
- Create: `packages/admin-system/src/shell/page-container.tsx`
- Create: `packages/admin-system/src/shell/protected-app-layout.tsx`
- Create: `apps/admin/components/layout/admin-guard.tsx`
- Create: `apps/admin/config/nav.tsx`
- Modify: `packages/admin-system/src/index.ts`
- Modify: `apps/admin/app/(protected)/layout.tsx`
- Delete: `apps/admin/components/layout/protected-layout.tsx`
- Test: `apps/admin/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Create the generic shell components**

Create `packages/admin-system/src/shell/sidebar.tsx`:

```tsx
import Link from 'next/link'
import { type ReactNode } from 'react'
import type { BackofficeNavItem } from '../models/nav'

interface SidebarProps {
  appName: string
  items: BackofficeNavItem[]
  pathname: string
  footer: ReactNode
}

export function Sidebar({ appName, items, pathname, footer }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">{appName}</h2>
      </div>
      <nav className="space-y-1 p-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'flex items-center gap-3 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary' : 'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100'}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-100 p-4">{footer}</div>
    </aside>
  )
}
```

Create `packages/admin-system/src/shell/page-container.tsx`:

```tsx
import type { ReactNode } from 'react'

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl">{children}</div>
}
```

Create `packages/admin-system/src/shell/app-shell.tsx`:

```tsx
import type { ReactNode } from 'react'

export function AppShell({
  sidebar,
  topbar,
  children
}: {
  sidebar: ReactNode
  topbar: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {sidebar}
      <div className="flex min-h-screen flex-1 flex-col">
        {topbar}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
```

Create `packages/admin-system/src/shell/topbar.tsx`:

```tsx
import type { ReactNode } from 'react'
import { PageContainer } from './page-container'

export function Topbar({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <PageContainer>
        <div className="flex h-full items-center justify-between">
          <div className="text-sm font-medium text-slate-900">{title}</div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </PageContainer>
    </header>
  )
}
```

- [ ] **Step 2: Create the shared protected layout wrapper**

Create `packages/admin-system/src/shell/protected-app-layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { AppShell } from './app-shell'
import { PageContainer } from './page-container'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import type { BackofficeNavItem } from '../models/nav'

interface ProtectedAppLayoutProps {
  appName: string
  navItems: BackofficeNavItem[]
  pathname: string
  topbarTitle: string
  sidebarFooter: ReactNode
  children: ReactNode
}

export function ProtectedAppLayout(props: ProtectedAppLayoutProps) {
  const { appName, navItems, pathname, topbarTitle, sidebarFooter, children } = props
  return (
    <AppShell
      sidebar={<Sidebar appName={appName} items={navItems} pathname={pathname} footer={sidebarFooter} />}
      topbar={<Topbar title={topbarTitle} />}
    >
      <PageContainer>{children}</PageContainer>
    </AppShell>
  )
}
```

- [ ] **Step 3: Add admin-specific guard and nav config**

Create `apps/admin/components/layout/admin-guard.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@mini-schedule/api/auth'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }
    if (user?.user_type !== 'admin') {
      router.push('/unauthorized')
    }
  }, [isAuthenticated, pathname, router, user])

  if (!isAuthenticated) return null
  return <>{children}</>
}
```

Create `apps/admin/config/nav.tsx`:

```tsx
import { LayoutDashboard, Shield, Building2 } from 'lucide-react'
import type { BackofficeNavItem } from '@mini-schedule/admin-system'

export const adminNavItems: BackofficeNavItem[] = [
  { href: '/dashboard', label: '概览', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/brands', label: '品牌管理', icon: <Building2 className="h-4 w-4" /> },
  { href: '/admins', label: '管理员管理', icon: <Shield className="h-4 w-4" /> }
]
```

- [ ] **Step 4: Replace the app-local protected layout**

Modify `apps/admin/app/(protected)/layout.tsx`:

```tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAdminLogout } from '@mini-schedule/api/admin'
import { useAuthStore } from '@mini-schedule/api/auth'
import { ProtectedAppLayout } from '@mini-schedule/admin-system/shell/protected-app-layout'
import { AdminGuard } from '@/components/layout/admin-guard'
import { adminNavItems } from '@/config/nav'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useAdminLogout()

  return (
    <AdminGuard>
      <ProtectedAppLayout
        appName="平台管理后台"
        navItems={adminNavItems}
        pathname={pathname}
        topbarTitle="Mini Schedule"
        sidebarFooter={
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm text-slate-500">{user?.display_name}</span>
            <Button
              variant="ghost"
              size="sm"
              disabled={logoutMutation.isPending}
              onClick={async () => {
                try {
                  await logoutMutation.mutateAsync()
                } finally {
                  logout()
                  router.push('/login')
                  router.refresh()
                }
              }}
            >
              {logoutMutation.isPending ? '退出中...' : '退出'}
            </Button>
          </div>
        }
      >
        {children}
      </ProtectedAppLayout>
    </AdminGuard>
  )
}
```

- [ ] **Step 5: Export the shared shell surface**

Modify `packages/admin-system/src/index.ts`:

```ts
export * from './models/nav'
export * from './models/page-meta'
export * from './shell/protected-app-layout'
```

- [ ] **Step 6: Verify admin still boots with the new shell**

Run:

```bash
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/admin lint
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/admin build
```

Manual smoke check:

```txt
Open http://localhost:3001/dashboard
Expected: sidebar still renders, logout still works, protected routes still redirect when logged out.
```

---

### Task 3: Introduce dashboard primitives and upgrade `admin/dashboard`

**Files:**
- Create: `packages/admin-system/src/components/page-header.tsx`
- Create: `packages/admin-system/src/components/stat-card.tsx`
- Create: `packages/admin-system/src/components/section-card.tsx`
- Create: `packages/admin-system/src/templates/dashboard-page-template.tsx`
- Modify: `packages/admin-system/src/index.ts`
- Modify: `apps/admin/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Create the page-level dashboard building blocks**

Create `packages/admin-system/src/components/page-header.tsx`:

```tsx
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  )
}
```

Create `packages/admin-system/src/components/stat-card.tsx`:

```tsx
export function StatCard({
  label,
  value,
  hint
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  )
}
```

Create `packages/admin-system/src/components/section-card.tsx`:

```tsx
import type { ReactNode } from 'react'

export function SectionCard({
  title,
  children
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="text-sm leading-6 text-slate-600">{children}</div>
    </section>
  )
}
```

- [ ] **Step 2: Create the dashboard template**

Create `packages/admin-system/src/templates/dashboard-page-template.tsx`:

```tsx
import type { ReactNode } from 'react'

export function DashboardPageTemplate({
  header,
  stats,
  primary,
  secondary
}: {
  header: ReactNode
  stats: ReactNode
  primary: ReactNode
  secondary: ReactNode
}) {
  return (
    <div className="space-y-8 p-8">
      {header}
      {stats}
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <section className="space-y-6">{primary}</section>
        <aside className="space-y-6">{secondary}</aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace the primitive admin dashboard page**

Modify `apps/admin/app/(protected)/dashboard/page.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { DashboardPageTemplate } from '@mini-schedule/admin-system/templates/dashboard-page-template'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { StatCard } from '@mini-schedule/admin-system/components/stat-card'
import { SectionCard } from '@mini-schedule/admin-system/components/section-card'

export default function DashboardPage() {
  return (
    <DashboardPageTemplate
      header={
        <PageHeader
          title="概览"
          description="查看平台品牌、管理员与系统运行状态"
          actions={<Button>导出报表</Button>}
        />
      }
      stats={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="品牌总数" value="--" hint="接入品牌总量" />
          <StatCard label="活跃品牌" value="--" hint="最近 30 天有活跃数据" />
          <StatCard label="管理员数" value="--" hint="当前可登录后台的账号数" />
          <StatCard label="待处理事项" value="--" hint="待审核与异常提醒" />
        </div>
      }
      primary={
        <>
          <SectionCard title="近期活动">最近活动时间线占位，后续接入真实数据。</SectionCard>
          <SectionCard title="品牌趋势">品牌增长或审核趋势图占位，后续接入图表。</SectionCard>
        </>
      }
      secondary={
        <>
          <SectionCard title="快捷操作">品牌创建、管理员创建、查看异常等快捷入口。</SectionCard>
          <SectionCard title="系统状态">展示接口、任务与环境状态摘要。</SectionCard>
        </>
      }
    />
  )
}
```

- [ ] **Step 4: Verify dashboard structure and build health**

Run:

```bash
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/admin lint
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/admin build
```

Manual smoke check:

```txt
Open http://localhost:3001/dashboard
Expected: page shows header, 4 stats, main grid with left and right content areas.
```

---

### Task 4: Standardize login entry for `admin` and `brand`

**Files:**
- Create: `packages/admin-system/src/templates/login-shell.tsx`
- Modify: `packages/admin-system/src/index.ts`
- Modify: `apps/admin/app/(auth)/login/page.tsx`
- Modify: `apps/brand/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create the shared login shell**

Create `packages/admin-system/src/templates/login-shell.tsx`:

```tsx
import type { ReactNode } from 'react'

export function LoginShell({
  title,
  description,
  aside,
  children
}: {
  title: string
  description: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.1fr,0.9fr]">
      <section className="hidden border-r border-slate-200 bg-white px-12 py-16 lg:block">
        <div className="max-w-xl space-y-6">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Mini Schedule Backoffice
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="text-base leading-7 text-slate-600">{description}</p>
          </div>
          {aside}
        </div>
      </section>
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Wrap the admin login form in the shared shell**

Modify `apps/admin/app/(auth)/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminLogin } from '@mini-schedule/api/auth'
import { LoginShell } from '@mini-schedule/admin-system/templates/login-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码')
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const loginMutation = useAdminLogin()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' }
  })

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    try {
      await loginMutation.mutateAsync(data)
      router.push('/dashboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LoginShell
      title="平台管理后台"
      description="登录以管理平台品牌、管理员和系统运营数据。"
      aside={<p className="text-sm text-slate-500">支持超级管理员、运营和客服账号登录。</p>}
    >
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">登录</CardTitle>
          <CardDescription>输入用户名和密码进入后台</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" placeholder="请输入用户名" {...register('username')} />
              {errors.username ? <p className="text-sm text-destructive">{errors.username.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="请输入密码" {...register('password')} />
              {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || loginMutation.isPending}>
              {isSubmitting || loginMutation.isPending ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </LoginShell>
  )
}
```

- [ ] **Step 3: Wrap the brand login form in the shared shell**

Modify `apps/brand/app/(auth)/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBrandLogin } from '@mini-schedule/api/auth'
import { LoginShell } from '@mini-schedule/admin-system/templates/login-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
  password: z.string().min(1, '请输入密码')
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const loginMutation = useBrandLogin()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' }
  })

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    try {
      await loginMutation.mutateAsync(data)
      router.push('/dashboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LoginShell
      title="品牌管理后台"
      description="登录以管理品牌学员、课程和训练记录。"
      aside={<p className="text-sm text-slate-500">品牌管理员通过手机号和密码登录。</p>}
    >
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">登录</CardTitle>
          <CardDescription>输入手机号和密码进入品牌后台</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input id="phone" type="tel" placeholder="请输入手机号" {...register('phone')} />
              {errors.phone ? <p className="text-sm text-destructive">{errors.phone.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="请输入密码" {...register('password')} />
              {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || loginMutation.isPending}>
              {isSubmitting || loginMutation.isPending ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </LoginShell>
  )
}
```

- [ ] **Step 4: Verify both auth entry pages**

Run:

```bash
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/admin build
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/brand build
```

Manual smoke check:

```txt
Open http://localhost:3001/login
Open http://localhost:3002/login
Expected: both pages use the same shell structure with app-specific copy and unchanged form behavior.
```

---

### Task 5: Standardize admin list pages with shared list-page components

**Files:**
- Create: `packages/admin-system/src/components/status-badge.tsx`
- Create: `packages/admin-system/src/components/filter-bar.tsx`
- Create: `packages/admin-system/src/components/data-table.tsx`
- Create: `packages/admin-system/src/components/empty-state.tsx`
- Create: `packages/admin-system/src/components/loading-state.tsx`
- Create: `packages/admin-system/src/templates/resource-list-page.tsx`
- Modify: `packages/admin-system/src/index.ts`
- Modify: `apps/admin/app/(protected)/brands/page.tsx`
- Modify: `apps/admin/app/(protected)/admins/page.tsx`

- [ ] **Step 1: Create reusable list-page building blocks**

Create `packages/admin-system/src/components/status-badge.tsx`:

```tsx
const toneMap = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  neutral: 'bg-slate-100 text-slate-800',
  danger: 'bg-red-100 text-red-800'
} as const

export function StatusBadge({
  label,
  tone
}: {
  label: string
  tone: keyof typeof toneMap
}) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${toneMap[tone]}`}>{label}</span>
}
```

Create `packages/admin-system/src/templates/resource-list-page.tsx`:

```tsx
import type { ReactNode } from 'react'

export function ResourceListPage({
  header,
  filters,
  content,
  footer
}: {
  header: ReactNode
  filters?: ReactNode
  content: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="space-y-6 p-8">
      {header}
      {filters}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">{content}</div>
      {footer}
    </div>
  )
}
```

Create `packages/admin-system/src/components/empty-state.tsx`:

```tsx
export function EmptyState({
  title,
  description
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
    </div>
  )
}
```

Create `packages/admin-system/src/components/loading-state.tsx`:

```tsx
export function LoadingState({ title }: { title: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center p-8">
      <p className="text-sm font-medium text-slate-500">{title}</p>
    </div>
  )
}
```

Create `packages/admin-system/src/components/filter-bar.tsx`:

```tsx
import type { ReactNode } from 'react'

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{children}</div>
}
```

Create `packages/admin-system/src/components/data-table.tsx`:

```tsx
import type { ReactNode } from 'react'

export function DataTable({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>
}
```

- [ ] **Step 2: Refactor the admin brands page**

Modify `apps/admin/app/(protected)/brands/page.tsx`:

```tsx
import { ResourceListPage } from '@mini-schedule/admin-system/templates/resource-list-page'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { StatusBadge } from '@mini-schedule/admin-system/components/status-badge'
import { EmptyState } from '@mini-schedule/admin-system/components/empty-state'
import { DataTable } from '@mini-schedule/admin-system/components/data-table'
import { LoadingState } from '@mini-schedule/admin-system/components/loading-state'
import { FilterBar } from '@mini-schedule/admin-system/components/filter-bar'

const statusUi = {
  active: { label: '已启用', tone: 'success' as const },
  inactive: { label: '已停用', tone: 'danger' as const },
  pending: { label: '待审核', tone: 'warning' as const }
}

return (
  <ResourceListPage
    header={
      <PageHeader
        title="品牌管理"
        description="管理平台品牌入驻、启用状态和品牌详情。"
        actions={<DialogTrigger asChild><Button>创建品牌</Button></DialogTrigger>}
      />
    }
    filters={
      <FilterBar>
        <p className="text-sm text-slate-500">共 {data?.total ?? 0} 个品牌，支持创建、查看与状态变更。</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">导出列表</Button>
        </div>
      </FilterBar>
    }
    content={
      isLoading ? (
        <LoadingState title="正在加载品牌列表" />
      ) : !data?.items.length ? (
        <EmptyState title="暂无品牌" description="创建第一个品牌后，这里会出现品牌列表。" />
      ) : (
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>电话</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-mono text-sm">{brand.id}</TableCell>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{brand.contact_name ?? '-'}</TableCell>
                  <TableCell>{brand.contact_phone ?? '-'}</TableCell>
                  <TableCell>
                    <StatusBadge label={statusUi[brand.status].label} tone={statusUi[brand.status].tone} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/brands/${brand.id}`} className="text-sm text-primary hover:underline">
                        查看
                      </Link>
                      {brand.status === 'pending' ? (
                        <button
                          type="button"
                          className="text-sm text-green-600 hover:underline"
                          onClick={() => statusMutation.mutate({ id: brand.id, status: 'active' })}
                        >
                          启用
                        </button>
                      ) : null}
                      {brand.status === 'active' ? (
                        <button
                          type="button"
                          className="text-sm text-amber-600 hover:underline"
                          onClick={() => statusMutation.mutate({ id: brand.id, status: 'inactive' })}
                        >
                          停用
                        </button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      )
    }
    footer={
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          共 {data.total} 条，第 {data.page} 页 / 共 {Math.ceil(data.total / data.page_size)} 页
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(data.total / data.page_size)}
            onClick={() => setPage((current) => current + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    }
  />
)
```

- [ ] **Step 3: Refactor the admin admins page**

Modify `apps/admin/app/(protected)/admins/page.tsx`:

```tsx
import { ResourceListPage } from '@mini-schedule/admin-system/templates/resource-list-page'
import { FilterBar } from '@mini-schedule/admin-system/components/filter-bar'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { StatusBadge } from '@mini-schedule/admin-system/components/status-badge'
import { EmptyState } from '@mini-schedule/admin-system/components/empty-state'
import { LoadingState } from '@mini-schedule/admin-system/components/loading-state'
import { DataTable } from '@mini-schedule/admin-system/components/data-table'

const roleTone = {
  super_admin: 'neutral' as const,
  operator: 'success' as const,
  support: 'warning' as const
}

return (
  <ResourceListPage
    header={
      <PageHeader
        title="管理员管理"
        description="管理平台后台账号和角色分配。"
        actions={<DialogTrigger asChild><Button>创建管理员</Button></DialogTrigger>}
      />
    }
    filters={
      <FilterBar>
        <p className="text-sm text-slate-500">当前管理员账号列表，支持角色区分和新增账号。</p>
      </FilterBar>
    }
    content={
      isLoading ? (
        <LoadingState title="正在加载管理员列表" />
      ) : !data?.items.length ? (
        <EmptyState title="暂无管理员" description="创建第一个管理员账号后，这里会出现列表。" />
      ) : (
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>昵称</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-mono text-sm">{admin.id}</TableCell>
                  <TableCell className="font-medium">{admin.username}</TableCell>
                  <TableCell>{admin.nickname ?? '-'}</TableCell>
                  <TableCell>
                    <StatusBadge label={roleLabels[admin.role] ?? admin.role} tone={roleTone[admin.role]} />
                  </TableCell>
                  <TableCell>{new Date(admin.created_at).toLocaleDateString('zh-CN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      )
    }
  />
)
```

- [ ] **Step 4: Verify admin list-page migration**

Run:

```bash
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/admin lint
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/admin build
```

Manual smoke check:

```txt
Open http://localhost:3001/brands
Open http://localhost:3001/admins
Expected: both pages share the same header, card frame, loading/empty treatment, and footer rhythm.
```

---

### Task 6: Migrate `brand` to the shared protected shell and dashboard

**Files:**
- Create: `apps/brand/components/layout/brand-guard.tsx`
- Create: `apps/brand/config/nav.tsx`
- Modify: `apps/brand/app/(protected)/layout.tsx`
- Modify: `apps/brand/app/(protected)/dashboard/page.tsx`
- Delete: `apps/brand/components/layout/sidebar.tsx`

- [ ] **Step 1: Create brand-specific guard and nav config**

Create `apps/brand/components/layout/brand-guard.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@mini-schedule/api/auth'

export function BrandGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }
    if (user?.user_type !== 'brand') {
      router.push('/unauthorized')
    }
  }, [isAuthenticated, pathname, router, user])

  if (!isAuthenticated) return null
  return <>{children}</>
}
```

Create `apps/brand/config/nav.tsx`:

```tsx
import { LayoutDashboard, Users, BookOpen, Activity } from 'lucide-react'
import type { BackofficeNavItem } from '@mini-schedule/admin-system'

export const brandNavItems: BackofficeNavItem[] = [
  { href: '/dashboard', label: '概览', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/users', label: '学员管理', icon: <Users className="h-4 w-4" /> },
  { href: '/courses', label: '课程管理', icon: <BookOpen className="h-4 w-4" /> },
  { href: '/trainings', label: '训练记录', icon: <Activity className="h-4 w-4" /> }
]
```

- [ ] **Step 2: Migrate the brand protected layout to the shared shell**

Modify `apps/brand/app/(protected)/layout.tsx`:

```tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@mini-schedule/api/auth'
import { ProtectedAppLayout } from '@mini-schedule/admin-system/shell/protected-app-layout'
import { BrandGuard } from '@/components/layout/brand-guard'
import { brandNavItems } from '@/config/nav'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

  return (
    <BrandGuard>
      <ProtectedAppLayout
        appName="品牌管理后台"
        navItems={brandNavItems}
        pathname={pathname}
        topbarTitle="Brand Workspace"
        sidebarFooter={
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm text-slate-500">{user?.display_name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout()
                router.push('/login')
                router.refresh()
              }}
            >
              退出
            </Button>
          </div>
        }
      >
        {children}
      </ProtectedAppLayout>
    </BrandGuard>
  )
}
```

- [ ] **Step 3: Upgrade the brand dashboard to the shared template**

Modify `apps/brand/app/(protected)/dashboard/page.tsx`:

```tsx
'use client'

import { DashboardPageTemplate } from '@mini-schedule/admin-system/templates/dashboard-page-template'
import { PageHeader } from '@mini-schedule/admin-system/components/page-header'
import { StatCard } from '@mini-schedule/admin-system/components/stat-card'
import { SectionCard } from '@mini-schedule/admin-system/components/section-card'

export default function DashboardPage() {
  return (
    <DashboardPageTemplate
      header={<PageHeader title="概览" description="查看学员、课程和训练记录概况。" />}
      stats={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="学员总数" value="--" hint="当前品牌学员总量" />
          <StatCard label="课程总数" value="--" hint="已创建课程数量" />
          <StatCard label="今日训练" value="--" hint="今日新增训练记录" />
          <StatCard label="待处理事项" value="--" hint="需要品牌管理员处理的事项" />
        </div>
      }
      primary={<SectionCard title="近期训练">训练动态占位。</SectionCard>}
      secondary={<SectionCard title="快捷操作">创建课程、查看学员等入口。</SectionCard>}
    />
  )
}
```

- [ ] **Step 4: Verify `brand` reuses the shared shell correctly**

Run:

```bash
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/brand lint
pnpm --dir /Users/liushan/Documents/zkw/mini_schedule/web --filter @mini-schedule/brand build
```

Manual smoke check:

```txt
Open http://localhost:3002/dashboard
Expected: brand uses the same protected shell structure as admin, but with brand navigation and brand copy.
```

---

## Self-Review

### Spec coverage

- shared `packages/admin-system` package: covered in Task 1
- shared protected shell: covered in Task 2
- dashboard page system: covered in Tasks 3 and 6
- login shell: covered in Task 4
- list-page system: covered in Task 5
- brand reuse after admin validation: covered by ordering Tasks 2 -> 3 -> 5 -> 6
- keeping `apps/app` out of scope: enforced by omission from every implementation task

### Placeholder scan

- no `TODO` or `TBD` markers used
- all file paths are explicit
- every code-writing step includes concrete code
- validation commands are explicit

### Type consistency

- shared nav type name is `BackofficeNavItem` in both package model and app configs
- shared page shell is `ProtectedAppLayout` across all tasks
- shared login shell is `LoginShell` across spec and tasks
- dashboard template name is `DashboardPageTemplate` in every reference

## Notes

- This workspace currently does not appear to be an initialized git repository, so commit steps are intentionally omitted from this plan. If git is initialized later, commit after each task-sized checkpoint using focused commit messages.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-admin-brand-backoffice-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
