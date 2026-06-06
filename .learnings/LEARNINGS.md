## 2026-05-27

- `pnpm --filter @mini-schedule/admin dev` 在 Codex sandbox 内监听 `0.0.0.0:3001` 会触发 `listen EPERM`；启动本地预览服务需要提升权限。
- Admin 前端构建会提示 Next.js 因用户目录存在额外 lockfile 而推断 workspace root 到 `/Users/liushan`，当前不阻断 build。

## 2026-05-28 skill routing memory

- Before web implementation, use `web/SKILLS.md` as the local skill router.
- Select only skills that are available in the current session; if a listed skill is unavailable, use the closest available local frontend/design/testing skill.
- For the current Next.js monorepo, default shortlist is `next-best-practices`, `frontend-design`, `clean-code`, `refactoring-patterns`, `state-management`, `api-integration`, `form-handling`, and `testing-strategy`.

## 2026-05-29 admin/brand shell sync

- Admin and brand backoffice apps both consume `@mini-schedule/admin-system` shell primitives; visual parity should start by changing app-level `ProtectedAppLayout` props before duplicating shell code.
- When syncing sidebar style across apps, align `sidebarStyle`, optional `navGroups`, sidebar footer content, and Electron `sidebarTopInset` together; changing only CSS leaves layout behavior inconsistent.
- Brand app currently lacks a dedicated ESLint flat config. `pnpm --filter @mini-schedule/brand lint` invokes deprecated interactive `next lint`, while `eslint .` fails without `eslint.config.*`; use `tsc --noEmit` for immediate validation until lint config is added.
- For local visual checks, keep admin/brand ports distinct: admin on `3001`, brand on `3002`, starter reference on `3000`. Verify sidebar expanded/collapsed state and footer close behavior in Chrome after shell changes.

## 2026-06-06 Pre-Batch-4 frontend baseline

为 Batch 4（Brand 初始化向导 + Location CRUD）准备的前端约定快照。新加页面/组件务必遵循以下既有 pattern，不要重新造轮子。

### 1. 路由结构与命名约定（`apps/brand/app/`）

- App Router 用路由分组：`(auth)` 放公共页（login / signup / signup/plan / signup/payment/[order_id]），`(protected)` 放需登录页（dashboard / users / courses / trainings / messages / unauthorized）。
- `(protected)/layout.tsx` 已统一接入 `ProtectedAppLayout`（来自 `@mini-schedule/admin-system/shell/protected-app-layout`），新页只需写 `page.tsx`，不要重复 sidebar/topbar。
- 详情页用 `[id]/page.tsx`（参考 `courses/[id]`、`users/[id]`）。
- 文件命名一律 kebab-case，组件函数 PascalCase，页面默认导出。
- 新增导航项要同步改 `apps/brand/config/nav.tsx`（`brandNavItems`）+ `(protected)/layout.tsx` 里 `brandNavGroups` 分组。Batch 4 的「门店」「初始化向导」就走这里。

### 2. API 客户端调用模式（`packages/api/`）

- **不要手写 fetch**。统一用 `http.{get,post,put,patch,delete}`（`packages/api/src/client.ts`），封装了：
  - 浏览器端自动走 Next.js 同源 rewrite（前缀 `/api/v1/{public,brand,admin}/`），SSR 直连 `NEXT_PUBLIC_API_URL`。
  - 自动从 `localStorage['auth-storage'].state.accessToken` 读 JWT 加 `Authorization: Bearer`（admin 走 cookie）。
  - 响应 `{code, message, data}`：`code !== 'OK'` 抛 `ApiErrorClass`，默认 toast.error。**只有在 form 内联展示错误时才传 `{ silent: true }`**（参考 signup page 的 `apiError` 状态）。
- React Query 是数据层默认方案。新写 hook 全部放 `packages/api/src/brand.ts`，命名 `useBrand<Resource>` / `useCreate<Resource>` / `useUpdate<Resource>` / `useDelete<Resource>`：
  - `queryKey: ['brand-locations', page, pageSize]` —— 资源名 + 关键参数。
  - mutation 成功后 `queryClient.invalidateQueries({ queryKey: ['brand-locations'] })`。
  - 列表统一 `PageResponse<T>`（`page`、`page_size`、参考 `useBrandCourses`）。
- QueryClient 默认 `staleTime: 5min`、`gcTime: 30min`、`retry: 1`、`refetchOnWindowFocus: false`（`apps/brand/app/providers.tsx`）。不要在 page 里覆盖。

### 3. shadcn / Tailwind 约定

- shadcn config: `style: new-york`、`baseColor: slate`、`cssVariables: true`、`prefix: ''`（`apps/brand/components.json`）。新组件 `npx shadcn add ...` 默认就对。
- UI 原子放 `apps/brand/components/ui/`（card/button/input/dialog/select/table/textarea/label），import 用 alias `@/components/ui/...`、`@/lib/utils`。
- **跨 app 复用** 的 shell / template / data-table 一律走 `@mini-schedule/admin-system`（含 `DataTable`、`ResourceListPage`、`SectionCard`、`EmptyState`、`StatusBadge`、`FilterBar`、`PageHeader`）。Batch 4 的 Location 列表页**先看 `packages/admin-system/src/templates/resource-list-page.tsx` 能不能直接用**，能用就别在 brand app 写表格。
- 设计 token 全部走 `app/globals.css` 的 CSS variables（`--primary`、`--sidebar`、`--radius` 等），不要硬编码颜色 hex；类名优先 `bg-primary`、`text-muted-foreground`、`border-sidebar-border`。
- Tailwind v4（`@import 'tailwindcss'` + `@theme`），admin-system 包通过 `@source "../../../packages/admin-system/src/**/*.{ts,tsx}"` 扫描类名 —— **新增跨包组件如果用了新 utility class，要确认该路径仍能扫到**。

### 4. 状态管理 / 持久化

- **全局 auth state**：Zustand + `persist`（`packages/api/src/auth.ts`，store name `auth-storage`）。`useAuthStore()` 暴露 `accessToken / user / isAuthenticated / login / logout`。新页判断登录直接用，**不要再发 `/me` 请求**。
- **路由守卫**：双层 —— middleware 检查 cookie `brand_access_token`（`apps/brand/middleware.ts`，公开前缀 `/signup`、`/login`），`(protected)/layout.tsx` 再 client-side 校验 `user.user_type === 'brand'`。Batch 4 新页都在 `(protected)/` 下，**不用再单独写守卫**。新增公开页路径要加进 `publicExact` 或 `publicPrefixes`。
- **跨步骤数据传递**（向导专用）：用 `sessionStorage`，key 用 `signup-form` 这种命名（参考 `(auth)/signup/page.tsx`）。Batch 4 的初始化向导直接沿用：`sessionStorage.setItem('brand-onboarding', JSON.stringify(data))`。**不要为多步表单上 Zustand**。
- 业务依赖 `zustand@5` 已装但**仅** auth 在用，新增全局 store 要先想清楚是否真需要（多数情况 React Query cache + sessionStorage 够了）。

### 5. 表单库

- **React Hook Form + Zod + `@hookform/resolvers/zod`** 是唯一约定（已装）。范式参考 `(auth)/signup/page.tsx`：
  - 顶部定义 `const xxxSchema = z.object({...})` + `type XxxForm = z.infer<typeof xxxSchema>`。
  - `useForm<XxxForm>({ resolver: zodResolver(...), defaultValues: {...} })`。
  - 原生 input 用 `register('field')`，shadcn `Select` 等受控组件用 `<Controller>`。
  - 字段级错误：`errors.field && <p className="text-sm text-destructive">{errors.field.message}</p>`。
  - API 级错误：mutation 默认 toast；如需 inline，传 `{ silent: true }` + 自己 setState（参见 signup 的 `apiError` + `data-testid="api-error"`）。
  - 中文文案放 schema message 内，不要散落在 JSX。
- 不要引入 Formik / 自写 useState 表单。

### 6. 其他

- Toast：`sonner`，全局 Toaster 已在 `providers.tsx` 注册（`position="top-right" richColors`）。直接 `import { toast } from 'sonner'`，**不要再加一个 Toaster**。
- Lint 现状：brand 没有 `eslint.config.*`，`pnpm lint` 跑废弃命令。Batch 4 开发完用 `pnpm --filter @mini-schedule/brand exec tsc --noEmit` 自检。
- 后端错误码常量在 `packages/api/src/errors.ts` 的 `ErrorCodes`，需要按 code 分支处理时 import 它，**不要字符串字面量比较**。
