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

## 2026-06-06 Batch 4 onboarding/locations patterns

落地后回看与 Pre-Batch-4 baseline 的偏差，沉淀给 Batch 5 复用。

### 1. WizardShell 实际未抽到共享包，定位在 brand app

最终 `apps/brand/components/onboarding/wizard-shell.tsx` 一并 export `ONBOARDING_STEP_KEYS / _LABELS / _ROUTES / SKIPPABLE_STEP_KEYS` 四个常量 —— **页面拿步骤元数据直接从 `wizard-shell` import**，没有单独抽 constants 文件。Batch 5 加新业务步骤时，去 wizard-shell 改这四个 map 即可，不要新建 `onboarding-meta.ts`。signup 流程仍在用 `components/signup/page-shell`，目前没合并，baseline 里"signup 和 onboarding 都用同一个 shell"的设想没实现 —— 两者视觉相近但导航语义不同（signup 线性 / onboarding 可跳），强行合并反而复杂。

### 2. 三层守卫：middleware → (protected)/layout → onboarding/layout

`onboarding/layout.tsx` 是第三层，处理三种重定向语义：
- 未登录 → `/login?next=${pathname}`（即便父层已踢，仍显式写一次，处理直链）
- `profileQuery.data.status !== 'active'` → `/signup/plan`（没拿到 order_id，让用户重新选套餐生成新单）
- `statusQuery.data.overall_status === 'completed'` → `/dashboard`

三个 effect **互不依赖、彼此独立**，render 时再做 `if (!brand || ... ) return null` 兜底，避免 effect 还没跑就闪出错误内容。Batch 5 任何"完成后强制离开"的页面（如 staff 完成跳次页）都照这个模板：分多个 effect + render null gate。

### 3. shadcn switch 没装，按"link-button + ConfirmDialog"模式实现状态切换

baseline 预测要 `npx shadcn add switch`，实际**没装**。`LocationStatusToggle` 用普通 `<button>` + 颜色（active 用 amber-600 停用 / inactive 用 green-600 启用）+ `ConfirmDialog` 二次确认。

**何时该写自定义而不是装新组件**：状态切换涉及破坏性副作用（停用门店影响小程序展示）时，Switch 的"立即切换"语义反而危险；改用 link-button + Confirm 让操作可被取消，且与已有的 courses 发布/归档操作视觉一致。Batch 5 的 Staff 启用/停用、Course 上架/下架直接复用 `LocationStatusToggle` 这个 pattern（替换 hook 和文案）。

### 4. ConfirmDialog 已通用，放 `components/common/`

`apps/brand/components/common/confirm-dialog.tsx` 暴露 `{open, title, description: ReactNode, confirmText, destructive, loading, onCancel, onConfirm}`，`onConfirm` 可 async，自己管 pending 状态。Batch 5 的 CRUD 删除/停用直接 import，**不要每页再写一个**。description 接 `ReactNode` 不是 string —— 允许内嵌高亮字段名（如 "门店「<span>X</span>」"），删除前展示真实数据。

### 5. 支付成功 → `/login?next=/onboarding` 而不是 sessionStorage 接力

支付页轮询到 paid 后，由用户**点 CTA** 跳 `/login?next=${encodeURIComponent('/onboarding')}`，登录页用 `searchParams.get('next')` 解析，校验 `next.startsWith('/')` 防开放重定向，回退顺序 `next → callbackUrl → /dashboard`。

**取舍**：sessionStorage 接力会被新窗口/隐私模式打破；URL param 是无状态串接，刷新/分享/退回任何时候都能恢复，且 next 是 brand 域名内部路径，安全风险只剩"防御外部 URL 注入"（一行 startsWith 检查即可）。Batch 5 任何"操作完成 → 跳登录 → 再跳目标页"的场景都用 next 参数，不要回头用 sessionStorage。

附带：login 用了 `useSearchParams`，**必须 Suspense 包裹**默认 export 的 page 组件，否则 Next 15 prerender 会 bail out。Batch 5 其他需 searchParams 的页同样规则。

### 6. QUOTA_EXCEEDED 同时 toast + inline，SUBSCRIPTION_RESTRICTED 同样

`LocationFormDialog.mapApiError` 把后端 code 映射成中文文案，**但对 `QUOTA_EXCEEDED / SUBSCRIPTION_RESTRICTED` 这两类"需要用户去做别的事"的错误，同时 `toast.error(msg)` + `setApiError(msg)` 双展示**：toast 抓眼球告诉用户"出问题了"，inline 留在表单里让用户能看到上下文（哪些字段已填）。其他普通校验错误（如 name 重复）只 inline，不打扰。

后端 QUOTA_EXCEEDED 的 `Response.Data: {current, max}` 当前**没在 UI 利用** —— 文案是写死的"请联系平台升级套餐"。如果 Batch 5 接入套餐升级页，可以改成 `已用 ${current}/${max}，[升级套餐]` 内联可点链接。

### 7. 列表页复合 pattern：表格 + Dialog + StatusToggle + ConfirmDialog

`onboarding/locations/page.tsx` 是一个完整的 CRUD 复合页范式，由 4 个组件协同 + 3 个本地 state 驱动：
```
state: { dialogOpen, editing: T|null, pendingDelete: T|null }
components: <Table> + <LocationFormDialog open initial=editing> + <StatusToggleButton> + <ConfirmDialog open=Boolean(pendingDelete)>
```

特点：**`editing=null` 走创建，`editing=T` 走编辑，不开两个 dialog**；删除二次确认用单独的 `pendingDelete` state，与 dialogOpen 解耦。Batch 5 的 Staff / Course / Entitlement / Class Session CRUD 全部按此结构开页。

### 8. baseline 预测 ResourceListPage / DataTable，实际用了原生 shadcn Table

baseline 推荐 `@mini-schedule/admin-system` 的 `ResourceListPage` + `DataTable`，locations 实际**没用** —— 直接用 shadcn `Table` + 自管分页 state。原因：onboarding step 的"表格"是嵌在 WizardShell 里的简短列表（page_size=50 一页够），不是完整管理页；不需要 filter / 分页 / URL 同步那一套。

Batch 5 判断标准：**onboarding step 内的列表用裸 Table；`(protected)/locations/page.tsx` 这种"长期管理页"才上 ResourceListPage**。两者可以共用 `LocationFormDialog`、`LocationStatusToggle`，但顶层 page 结构不同。

## 2026-06-06 Batch 5 staff/instructor patterns

落地 staff 列表 / 详情 / 角色 / 门店任职 / 教练档案后回看 Batch 4 复用清单的实际兑现。

### 1. "复用 LocationFormDialog 模板"实际是抄结构、不是 import

`StaffCreateDialog` 516 行 vs `LocationFormDialog` 206 行——结构（顶部 zod → 双 mutation → `mapApiError` → QUOTA 同时 toast+inline → `useEffect([open,initial]) reset`）完全沿用，但**没有任何共享代码**。原因：staff 业务字段（`role_codes` 多选 + `location_assignments` 多行 `useFieldArray` + `is_primary` 单选 invariant + `initial_password` 校验）和 location 字段集合完全不重叠，强抽公共 Dialog 反而把 zod schema 和 RHF 类型搞复杂。Batch 6 的 course / entitlement Dialog 继续抄结构，不要等到第 4 个相同模板出现再考虑泛型抽象（rule of three+，4 次才开抽）。

### 2. WizardShell + StepPlaceholder 真复用、零复制

`/onboarding/staff/page.tsx` 直接 `import { WizardShell, ONBOARDING_STEP_ROUTES }`，并**直接 import** `/staff` 列表用的 `StaffCreateDialog / StaffStatusToggle / ConfirmDialog` 三件套，没有抄一份"onboarding 专用版"。两层 page（onboarding step 内 vs 独立菜单 `/staff`）只在顶层结构、`stepDone` gate、`下一步` 按钮上有差异。配合上线某 step 时**同步从 `VALID_DYNAMIC_KEYS` 删除 `staff` 键 + 从 `STEP_HINTS` 删 staff 项**，避免动态路由把人导回 placeholder。

### 3. PUT 全量替换的客户端 state 三段式

`StaffRoleAssignmentEditor` / `StaffLocationAssignmentEditor` 都用同一套：
1. **`rowsFromStaff(staff)` 纯函数**把后端 DTO 映成本地 RowState（带 `uid` 用作 React key，避开后端 id 在新增行时为空的问题）
2. **`useState(() => rowsFromStaff(staff))` 初始化** + **`useEffect([staff, editing])` 同步 prop**——但只在 `!editing` 时同步
3. **`setRows` 本地编辑**，保存成功后 mutation 触发 `invalidateQueries` 让父 query 重拉，再走 useEffect 回流

这是"服务端为 SoT + 不打断用户编辑"的最小实现：编辑中外部 invalidate（隔壁卡片保存触发）不会把当前编辑器里改了一半的内容冲掉。Batch 6 任何 PUT 全量替换的 list editor（如 staff 多角色批量、course 多教练绑定）照抄。

### 4. CSV 单字段 vs Chip 输入：v1 选 CSV 的取舍

`InstructorProfileSection` 的 specialties / certificates 后端是 `[]string`，前端用 `<Textarea>` + `splitCSV` / `joinCSV`（分隔符兼容 `,，;；`，展示用 `、`）。**没上 chip 输入组件**。

取舍：chip 输入需要键盘事件（Enter/Backspace/逗号触发分裂）+ 焦点态 + 拖拽排序，至少 200 行自研或装 react-tag-input。v1 用户只是想"录入几个标签"，textarea 体验够用、可全选粘贴。**Batch 6 出现第二个数组短文本字段（如 course tags）时再抽 `ChipInput`**，目前不开。

### 5. 编辑中 `editing` flag 锁住外部 hydrate

`if (!editing) setRows(rowsFromStaff(staff))`——这一行是"服务端为 SoT" pattern 不背刺用户的关键。如果省掉 `!editing` 守卫，隔壁 BasicInfoCard 一保存就 invalidate 父 staff query，editing 中的本卡片 rows 会被瞬间重置。Batch 6 任何"同页多编辑器"页面都要复用：本地 `editing` boolean + `useEffect` 里 gate 住同步。

### 6. owner 角色编辑器隐藏 + OWNER_PROTECTED 兜底双层防

`StaffRoleAssignmentEditor` 在 `staff.is_owner` 时**直接不渲染编辑按钮**（B3 修复），同时 catch 块里仍处理 `OWNER_PROTECTED` 错误码作为 race 防御（用户在 staff 数据回流前点了编辑）。Batch 6 任何"按 flag 隐藏入口 + 后端硬校验"的场景都按此双层来——UI 层不能依赖后端，后端不能依赖 UI 层。

### 7. mapApiError 中 setQuota(null) 在非 quota 分支也要清

B11 修复：`StaffCreateDialog.mapApiError` 原本只在 QUOTA 分支 `setQuota({current,max})`，结果用户撞了 3/3 quota 后改手机号重试撞 `STAFF_PHONE_DUPLICATED`，旧的 quota 计数仍残留在 dialog 里。Rule：**所有携带结构化 data 的错误状态（quota / suggestion / next-step link 等）在每个非自身分支都要显式 `setX(null)`**，不要靠 mount 时一次性 reset。

## 2026-06-11 Batch 6 RBAC enforcement / data_scope 前端消费侧

落地 `/me/permissions` 消费、菜单按权限隐藏、按钮 disabled+tooltip、跨用户缓存清理后的可复用经验。前端只是权限的**消费侧**，SoT 在后端 RBAC（permissions 表 + data_scope）；UI 守卫永远是体验优化，不能当安全边界，后端 403 兜底永远在。

### 1. fail-closed 权限消费是默认姿态（`lib/permissions.tsx`）

`usePermissions().has(code)` 在 **loading / error / 未授权（非 brand 用户）/ 数据未到** 任一情况一律返 `false`：`PermissionsProvider` 的 `useMemo` 里 `if (!data || isLoading || isError || !enabled)` 直接 ship 空 `Set` + `has: () => false`，连无 Provider 的 SSR/测试默认 context 也是 `has: () => false`。

取舍口诀：**宁可少给不可错给**。代价是用户在 perms 还没到时短暂看到 disabled 按钮；反向代价是看到 enabled 按钮点下去吃 403。Batch 7 任何新权限消费点都从 `usePermissions()` 取 `has`，**不要自己读 query.data 判空**（会漏掉 error 分支），也不要给 `has` 兜个"未知时默认 true"。

### 2. 权限码统一走 `PERMISSIONS` 常量，不写裸字符串

`PERMISSIONS = { STAFF_VIEW: 'staff.view', ... } as const` + `PermissionCode` 联合类型。组件里一律 `has(PERMISSIONS.STAFF_CREATE)`，**禁止 `has('staff.create')` 字面量**——和 `errors.ts` 的 `ErrorCodes` 同源思路：码改名只动一处、typo 编译期就挂。后端新增权限码先在这里登记。

### 3. 菜单按权限隐藏 vs 区内操作 disabled —— 两种粒度分工明确

- **整块功能区**（有无 view 权限）：`(protected)/layout.tsx` 的 `NAV_HREF_PERMISSIONS` 把路由前缀映射到 view 权限码，无权限**直接从 sidebar 移除**菜单项（`visibleNavItems.filter`）。map **故意稀疏**——没登记的 href（Batch 6 之前的 users/courses/messages）默认全可见，等各自 batch 定义权限再加。
- **区内单个操作**（create / edit / delete）：进了页面后用 **按钮 disabled + tooltip**，不从 DOM 摘掉——用户能看到"有这个操作但我没权限"，比凭空消失更可理解。
- **loading 期乐观显示全菜单**：`if (permsLoading) return true`，否则每次 page nav 侧边栏会闪一下/空出来。这层乐观靠 button-level guard（fail-closed 的 disabled）兜底，短窗口内点进去也是 disabled，不会越权。**菜单隐藏可以乐观，按钮 enable 必须 fail-closed**——两层粒度的乐观/保守方向相反，记牢。

### 4. disabled 控件的 tooltip —— 重磅复用模式（`components/ui/hint.tsx`）

**问题**：disabled 元素不派发指针事件，shadcn `Button` 又自带 `disabled:pointer-events-none`，原生 `title` 和直接挂在 button 上的 Radix tooltip 触发器**永远不弹**。

**解法**：`Hint` 包裹器把 Radix `TooltipTrigger asChild` 挂到一个**非 disabled 的 `<span>`** 上，并在 span 上加 `[&_:disabled]:pointer-events-none` 强制内部 disabled 子元素不吃事件——hover 落到 span 上，tooltip 正常弹。对 shadcn `Button` 和原生 `<button>` link-style 控件都适用。

约定用法（`content` falsy 时不包 wrapper，直出 children，所以三元很顺手）：
```tsx
<Hint content={canCreate ? undefined : '权限不足，请联系管理员'}>
  <Button disabled={!canCreate}>新增员工</Button>
</Hint>
```
比原生 `title` 多了样式 + 可聚焦 + `aria-describedby` 无障碍。Batch 7 任何"按钮因权限/quota/状态被 disable 还要解释原因"的场景一律用 `Hint`，**不要再写 `title=` 或自己包 tooltip**。

### 5. `/me/permissions` query 约定（`packages/api/src/me.ts`）

- `meQueryKeys.permissions() = ['brand-me-permissions']` —— **静态 queryKey，不带 user id**（这点见 ERRORS 的跨用户缓存泄漏条目，新增非 user-keyed query 必读）。
- `staleTime: 60s` 对齐后端 Redis TTL；`refetchOnWindowFocus: true` 让管理员改了权限后用户切回 tab 60s 内能看到新权限集；`retry: 1` 防瞬断烧权限检查。
- `fetchMyPermissions(true)` 默认 `silent`——权限拉取失败不弹 toast，交给 `usePermissions` fail-closed 静默降级。Batch 7 类似"基础设施类"query（feature flag / 配置）都按 silent + 上层 fail-closed。
- 返回体含 `data_scope`（`all_brand` / `assigned_locations[location_ids]` / `none`），`usePermissions().dataScope` 已透出。`none` 是显式 narrow case（无 active 角色），消费侧要 handle，不要假设非 none。data_scope 的列表过滤消费目前框架就位、具体列表页消费按需接。


## 2026-06-12 Batch 7 — 自定义角色 UI

- **失效"非活动" query 要用 `refetchType:'all'`**：删除操作发生在详情页、随即 `router.push` 回列表时，列表 query 已卸载（inactive）。`invalidateQueries` 默认 `refetchType:'active'` 只刷新活动 query → 列表 stale 直到硬刷。改 `{ queryKey, refetchType: 'all' }` 让非活动 query 也立即重拉。
- **B1 前后端语义必须对齐（增量）**：编辑器禁用"勾选 actor 无权授予的新权限"（canGrant=false 且未勾→disabled），但保留已勾的越权权限可移除。后端必须配套"只校验新增权限"，否则保存既有越权权限被拒、UI 无高亮项、用户无从下手。前端 disable 防新增 + 后端增量校验 = 一致。
- **角色编辑器三态复用一个 Dialog**：create/edit/copy 三模式共用一个组件——create 空表单 POST；edit 按 code 拉详情预填、PUT、scope 锁定（A3）；copy 从系统角色预填（name+「副本」、同 scope/perms）但走 POST。权限勾选树按 domain 分组，数据源 `GET /permissions`。

## 2026-06-12 Batch 8 — 门店管理页 + 共享底层修复

- **fetch 响应要先判空 body 再 parse**：后端 DELETE 返 `204 No Content`，`response.json()` 对空 body 抛 SyntaxError，会把成功请求变成 reject。统一改：先 `await response.text()`，空串时 ok→返 undefined、非 ok→抛通用 ApiError，非空再 `JSON.parse`。所有 DELETE 路径受益（client.ts，三端共用）。
- **zustand persist 路由守卫要等 rehydration**：hard load（deep-link/刷新）时 persist 未水合，`isAuthenticated` 瞬时 false，守卫会误跳 /login（middleware 再用 cookie 弹回 /dashboard）。加 SSR-safe `useAuthHydrated()`：`useState(false)` 初值（SSR/首帧都 false，不碰 client-only 的 persist API），仅在 `useEffect` 里 `persist.onFinishHydration()` + `persist.hasHydrated()` 兜底。**不能在 useState 初始化器里调 persist，SSR 会 TypeError**。守卫的跳转 effect + `return null` gate 都要 `&& authHydrated`。soft nav 不受影响（store 不会 un-hydrate）。
- **共享包新增直接 import 要同步声明依赖**：`packages/api/auth.ts` 直接 `import 'react'` 但 package.json 没声明 react（一直经 react-query 隐式用）→ dev 能跑、prod `build` 报 `Cannot find module 'react'`。给 packages/api 补 `peerDependencies.react` + devDependencies(react+@types/react)。**dev server 不全量 type-check，验收必须额外跑一次 prod build**。
- **门店管理页 = 镜像 /staff+/roles**：列表表格 + 状态筛选 + 分页 + 空状态 + 行操作（编辑/停用切换/删除）全部 permission-gate + Hint；复用既有 location API hooks/类型/form-dialog/status-toggle，零新增。data_scope 后端已过滤，前端无需处理。
- **e2e 确认弹窗按钮要 scope 到 dialog**：`ConfirmDialog` 的确认按钮文案是业务词（删除/停用 actionLabel）而非「确定」，且常与触发按钮同名 → `page.getByRole('dialog').getByRole('button', { name, exact: true })` 消歧。

## 2026-06-12 Batch 9 — e2e API-setup 模式

- **真实栈 e2e 的多步 setup 走 page.request 直连后端，别全用 UI**：UI 表单登录拿到 token（`page.evaluate` 读 `localStorage['auth-storage'].state.accessToken`）后，用 `page.request.{post,put,delete}` + `Authorization: Bearer` 直接调 `/api/v1/brand/*` 建/改/清测试数据（建门店、建员工并 `location_assignments` 一次派店、清任职）。比纯 UI 点选快且稳，UI 只留"被测断言"那步。请求走 :3002 经 Next rewrite 代理到后端，无需直连 :8081。
- **CreateStaffInput 支持内联 `location_assignments`**：建员工时一并 `[{location_id, assignment_type:'member', is_primary:true}]` 即派店，省一次 PUT location-assignments。
- **后端改了 guard 必须重启/重建再跑 e2e**：旧 `go run` 二进制不含新逻辑，G1 会假失败（连续两批的坑，已成定式）。

## 2026-06-15 Batch 10 — 已解决的 FR

- app/admin 水合竞态：两端 protected 守卫（app layout + AdminGuard）已接 `useAuthHydrated`，与 brand 一致。三端 deep-link/刷新不再瞬闪 /login。
- location list name 搜索：前端门店页加搜索框 + `useBrandLocations(page,pageSize,status,q?)`，后端 server-side ILIKE 过滤。
- 只读权限门 e2e 已落 `e2e/batch-10-location-permission-gate.spec.ts`。

## 2026-06-16 Batch 11 — 课程模板 + 排课前端

### 页面/弹窗照搬 locations + course-categories 模板
新管理页（/courses /schedule）全程 mirror /locations：`usePermissions` + `has(PERMISSIONS.X)` 算 canCreate/canEdit/canDelete → 写按钮 `disabled` + `Hint` tooltip；DataTable + 状态 Select + 搜索 Input + 分页；行操作 + ConfirmDialog 删除/取消；mutation hook `invalidateQueries(refetchType:'all')` + onboarding status 失效。表单弹窗照搬 category-form-dialog（RHF+zod，create/edit 用 `initial` 区分，`useEffect([open,initial])` reset）。data-testid 钩子按既有命名（`x-create-button` / `x-row` / `x-field-y` / `x-submit`）给 e2e。

### 「打开时默认全选」用 ref 一次性，别 keying on length
课程 dialog 默认全选可用门店：effect 若依赖 `locationIds.length`，create 模式取消最后一个会触发再回填，用户永远删不掉。改 `useRef(didDefault)` 一次性默认；edit 模式直接置 true（用 initial 回填，不默认）。规则：**“打开时初始化一次”的副作用用 ref 守卫，不要 keying on 会被用户改动的派生 length**。

### 时间输入 → RFC3339 给后端
排课 `new Date(`${date}T${time}`)`（本地时区解析）→ `.toISOString()`（UTC Z）；ends = starts + duration*60000。后端按 RFC3339 解析转 UTC 校验 starts>now。本地→UTC 由浏览器完成，无需手拼时区。

## 2026-06-16 Batch 12a — 资源管理前端 + 排课弹窗级联

### 新 api client 必须在 packages/api/package.json 的 exports 里登记
新建 `packages/api/src/location-resources.ts` 后，消费端 `import ... from '@mini-schedule/api/location-resources'` 解析不到，除非在 `package.json` `exports` map 加 `"./location-resources": "./src/location-resources.ts"`。每加一个 api 子模块都要同步这张表（class-sessions/course-categories 等都在）。

### 级联下拉：父变子清 + 子选回填默认
排课弹窗门店→资源级联：`useBrandLocationResources({location_id, status:'active'}, open && Boolean(locationId))`（enabled 双门：弹窗开 + 已选门店）；`useEffect(()=>setResourceId(''),[locationId])` 切门店清资源；选中资源后 `useEffect(()=>setCapacity(selectedResource.capacity),[selectedResource])` 容量回填（用户可改，后端最终按 显式>资源>课程）。「不绑定资源」用空 option，提交 `resourceId ? Number : null`。

### 资源管理页门店筛选默认首个 active（一次性 ref-free 守卫）
`/resources` 必须按门店看资源；`locationId` 初值 null，`useEffect` 在 `locations` 到位且 `locationId===null` 时设首个——条件里带 `locationId===null` 自然只跑一次，等价 ref 守卫。list query `enabled: locationId!==null`，避免 location_id=0 空查。

### 删除确认弹窗 RESOURCE_IN_USE 保持打开（同 LOCATION_IN_USE 约定）
删资源被场次/循环排课引用 → toast 提示 + ConfirmDialog 不关（不 setDeleting(null)），让用户先去取消场次；RESOURCE_NOT_FOUND 才关闭。镜像 Batch 9 门店删除。

## 2026-06-17 Batch 12b — 循环排课前端 + E2E 自动化坑

### 单页多视图用轻量 state Tabs，不必引 Radix Tabs
/schedule「单场次/循环排课」用 useState<'single'|'recurring'> + 两个按钮（border-b-2 active 态）切换，单场次内容包进 fragment 条件渲染，循环渲染 <RecurringTab/>。ui/ 无 Tabs 组件时这样最省，零新依赖。

### 批量生成结果用「表单↔结果面板」同弹窗切换
循环弹窗提交成功后 setResult(res) 切到结果面板（成功 N/跳过 M + 跳过清单），「完成」才关闭；全冲突(RECURRING_ALL_CONFLICT)读 err.data.skipped 内联展示（api-error 区 + 清单），非顶部 toast。

### 自动填充优先级用「源守卫」而非纯 effect 覆盖
容量默认：课程 effect 加 if(!selectedResource) 才用课程默认（资源优先）；deps 含 selectedResource 使清空资源后回退课程默认。否则「选资源→改课程」会被课程默认覆盖。

### E2E（chrome-devtools）自动化坑——写进回归复跑要点
- 周几复选框是 sr-only 隐藏 input，click/fill 点不到，需 el.click() 脚本触发。
- 原生 select 要用 value setter + dispatch('change') 才能更新 React state。
- 时间存 UTC：09:00 本地=01:00Z，按 starts_at 子串过滤会漏，需换算。
- 部分 edge（XOR/越界/资源/权限/级联）前端 radio 已强制，走后端 API 直连验证更直接。

## 2026-06-18 Batch 13a — 学员档案前端（/learners + /learner-tags）

### 页面/弹窗照搬 resources 模板（列表+表单+状态切换+详情占位 Tab）
`/learners` mirror `/resources`：`usePermissions`+`has(PERMISSIONS.LEARNER_*)` 算 canCreate/edit/delete/freeze → 写按钮 disabled+Hint；DataTable + 状态/门店 Select + 搜索 Input + 分页；删除 ConfirmDialog（`LEARNER_IN_USE` toast+弹窗保持，`LEARNER_NOT_FOUND` 关闭）。LearnerFormDialog mirror resource-form-dialog（RHF+zod，create/edit 用 `initial` 区分，QUOTA `getQuotaDetails`+inline 同 staff-create-dialog）。详情页用轻量 useState Tabs（权益/预约/履约空态占位，13b/c/e 填）。

### 编辑弹窗预填「单选关联」要防两类静默写入（code-review 双 P1）
主门店 select 两个坑：①回填值用 `initial ? (initial.primary_location_id ?? 0) : (defaultLocationId ?? 0)`——edit 模式**不能**回退到列表筛选门店（`defaultLocationId`），否则「编辑无主门店学员」会把当前筛选门店静默写进去。②下拉只装 active 门店时，学员主门店若已停用则选项缺失→native select 回退首项「未分配」→保存静默清空；必须把 `initial` 当前关联（即使停用）并入选项。规则：编辑弹窗里任何「单选外键」字段，回填来源只认实体当前值、选项集要包含实体当前值（哪怕它已不在 active 列表）。

### 反范式内嵌快照：源改了要失效宿主查询
`Learner.tags[]` 是后端 JOIN 出的标签快照（name/color）。改标签（`useUpdateLearnerTag`）只失效 `['brand-learner-tags']` 不够，列表/详情的 chip 会 stale → invalidateTags 同时失效 `['brand-learners']`+`['brand-learner']`。规则：A 实体内嵌了 B 的反范式快照时，B 的 mutation 要一并失效 A 的查询。

### inactive 实体的「二态切换」按钮要排除第三态
LearnerStatusToggle 用 `isActive = status !== 'frozen'` 算，inactive 会被当 active 显示「冻结」→点了把 inactive 翻 frozen（后端只校验目标态）。修：`if (status==='inactive') return null`。规则：active↔frozen 这类二态切换组件，碰到第三态（inactive）要显式短路，不能用 `!== 某态` 兜。

## 2026-06-18 Batch 13b — 权益产品页 + 学员权益 Tab

### 产品页 + 详情内嵌 Tab 照搬 + 复杂表单拆子组件
`/entitlement-products` mirror `/resources`/`/learners`。表单弹窗复杂（type 锁定 + total 仅 count-based 条件显示 + 双 scope all/specific + chip 多选）：text/number 字段走 RHF，type/scope/selectedIds 走 local state（type 驱动 total 显隐、scope 驱动 chip），onSubmit 合并 RHF data + local state + 手动校验（count-based total>0、specific≥1 id）。把 LimitField/ScopePicker 抽成同文件子组件控制体积。学员详情「权益」Tab 用一个 `EntitlementsTab(learnerId)` 组件（列表 + grant/adjust/transactions 三个内联子弹窗），详情页按 activeTab 条件渲染——13a 占位 Tab 这样落地，不动详情页骨架。

### 反范式快照 + 派生聚合的失效要跨查询（延续 13a + 新增 issued_count）
权益 mutation 失效 `['learner-entitlements']`；但 grant 还改产品的 `issued_count`（产品列表的反范式聚合），必须**额外**失效 `['brand-entitlement-products']`，否则产品页「已发放」滞后（F1 同期 P1）。规则：一个 mutation 若改了 A 实体又顺带改 B 实体的派生计数/快照，A 和 B 的查询都要失效。

### 编辑弹窗的 scope/外键选项要并入「当前已选但已停用/归档」项（13a 同源，多选版）
产品 scope chip 只从 active 门店 / published 课程拉 → 若产品 scope 含已停用门店/已归档课程，chip 缺失 → 看不到也删不掉。修：`locationOptions`/`courseOptions` = active 列表 ∪ (initial.scope_ids 中不在列表的，标「#id（已停用/已归档）」)。配合后端 scope 放宽为存在性，保留这些项不再 400。规则同 13a learner-form 主门店，扩到多选 scope。

### 列表行复用为编辑初值时，依赖 list DTO 填齐（F1 前端侧）
产品页 `setEditing(listRow)` 直接把列表项传进编辑弹窗当 `initial`。一旦 list DTO 漏字段（F1：location_ids/course_ids 空），编辑弹窗 scope 不回填→保存炸。前端侧规则：把 list 行复用为编辑 initial 前，确认该 list 端点返回了编辑所需的全部字段（或改为编辑时按 id 拉 detail）。

## 2026-06-22 Batch 13c — 预约下单前端（/bookings + 代预约弹窗 + /booking-policy + 预约Tab）

### 多模式弹窗 + 依赖查询用 local useState（非 RHF）
代预约弹窗（学员→场次→权益模式 auto/manual/none）：mode + selectedId + reason 走 `useState`（不走 RHF，因为有依赖查询 + 模式驱动显隐）。`useUsableEntitlements(sessionId, learnerId)` 仅在两者都有时 `enabled`，auto 显示首项预览 / manual 渲染下拉。`useEffect([learnerId, sessionId])` 清空 `manualId`（避免残留跨场次的非法权益）。提交前手动校验（manual 必选 id、none 必填 reason）。比硬塞 RHF 更清晰，镜像 13b grant 弹窗的 local-state-for-selects 思路。

### 可空限额表单：opt('')→null vs req('')→0 双轨
预约策略表单内部把限额存字符串，`toForm` 用 `n(v)=(v===null?'':String(v))` 回填、`toPayload` 用 `opt(s)=(s.trim()===''?null:Number(s))`(可空字段) 与 `req(s)=(s.trim()===''?0:Number(s))`(必填字段) 区分。「留空=不限(null)」与「0」语义不同，必须分两个 helper，否则 book_ahead_max/daily/weekly/concurrent 留空会被当 0 误传。后端对应字段须是 `number|null`（见后端 P0：domain struct 要有 json tag 且可空不 omitempty）。

### booking mutation 跨查询失效三连
下单/取消同时改：预约列表(`brand-bookings`)、场次 booked_count(`brand-class-sessions`)、学员权益 remaining/locked(`learner-entitlements`)。统一 helper 前缀失效三者 + `refetchType:'all'`。学员详情「预约」Tab 用 `['brand-bookings', {brand_learner_profile_id}]`，被 `['brand-bookings']` 前缀覆盖到。规则同 13a/13b：一个 mutation 改了 A 又顺带改 B 的派生计数，A/B 查询都要失效。

## 2026-06-22 Batch 13d — 候补前端（WaitlistDrawer + 转正 + 场次徽标）

### 弹窗/抽屉显示父实体派生态要从 live list 派生，不用打开时的冻结快照
WaitlistDrawer 头部显示场次「容量 N/N」+ 决定转正按钮是否 disabled（满员）。若用点击时传入的快照，抽屉内转正后 booked_count 变了头部不刷新、转正门控失灵。修：schedule 页存轻量 `waitlistRef`(只含点击时 id) + `useMemo` 从当前 `items` 派生完整 session（容量/booked）；列表无此场次时回退快照。转正失效 `brand-class-sessions` → items 重拉 → 派生 session 更新 → 抽屉头部+门控实时刷新。规则：模态里展示的父实体派生态（容量/计数/状态）应从 live query 派生，别用 props 冻结值。

### list 行的关联计数徽标要被关联 mutation 失效
场次行「候补 (N)」= ClassSessionListItem.waitlist_count（后端子查询）。waitlist 的 join/skip/cancel 改活跃候补数 → api client 的 invalidate 追加 `brand-class-sessions`/`brand-class-session`，否则徽标 stale。规则同 13c issued_count：A 的 list 带 B 派生计数，B mutation 要失效 A list。

### 复用 13c 弹窗权益模式子块做 PromoteDialog
转正弹窗的「auto 预览/manual 下拉/none 占位」与 13c BookingCreateDialog 同构，PromoteDialog 复用 `useUsableEntitlements(sessionId, learnerId)` + 同款 radio + 错误码 mapError。新批的「下单变体」弹窗直接照搬 13c 权益子块，不重写。

## 2026-06-24 Batch 13e — 签到前端（AttendanceDrawer + 履约 Tab）

### 派生终态从 null hold + 业务标志推断（后端不直给 released）
RecordsTab settleLabel：后端详情 join 过滤 released hold → 退课 booking 的 hold=null。区分靠条件顺序——先 requires_entitlement_fix→「占位·无权益」，再 no_show+null-hold→「已退回（退课）」，consumed→「(已消耗)」。占位永不误判为退课。

### 共享 mutation.isPending 会误禁整列；按行 id 跟踪在途
单 useMutation 实例的 isPending 对列表每行都 true → 标到课 A 时 B/C 全灰。用 useState<id|null> attendingId 只禁在途那一行。

### 抽屉场次态从最新列表 live 派生（沿用 13d）
AttendanceDrawer 的 session 从 schedule items.find(live) 派生 → 结束场次后 brand-class-sessions 失效 → status=completed → 「结束场次」按钮自动禁用。冻结快照会 stale。

### 签到入口对 completed 场次也可见
/schedule 行 showAttendance=scheduled|in_progress|completed（completed 上确认爽约），与「取消/候补」的 showLive=scheduled|in_progress 区分。

### invalidateBooking 补 entitlement-transactions
签到/爽约/取消均写 hold/release/consume/no_show_consume 流水 → 失效集补 entitlement-transactions（cancel 同样受益，原既有遗漏）。

## 2026-06-25 Batch 14a — C 端自助预约前端

### app C 端 api 模块（packages/api/app.ts）+ 学员友好失败文案
新 hooks useAppClassSessions/useAppBookings/useAppUsableEntitlements/useAppCreateBooking/useAppCancelBooking。mutation 用 {silent:true} + 页面 inline 展示；appBookingErrorText(err) 把 ApiErrorClass.code 映射学员视角中文（无权益/满员/时间冲突/超截止…），未知码回退后端 message。跨查询失效：预约/取消失效 app-class-sessions + app-bookings(+app-entitlements 留 14b)——课程表「剩余」、列表即时刷新靠 invalidate（冒烟验证 8→7 即时刷新）。

### 后端 int64 序列化为 JSON number → 前端 id 用 number 不用 string
后端无 int64→string marshaler，Booking.ID/Session.ID/entitlement_id 等序列化为 JSON number；共享 @mini-schedule/types 对这些实体已用 number。新 App* 类型 id/class_session_id/entitlement_id 必须 number。写成 string 是契约谎言：模板插值/JSON body 运行时容忍，但 query-key 共享与 string 方法会埋雷。code-review 抓出。

### C 端 fmtRange 用 toLocaleString；时区为既有 per-brand TZ FR
课程表/我的预约时间用 new Date(iso).toLocaleString('zh-CN',{...})（浏览器本地 TZ）。后端存 UTC，brand 实际 +08——精确 per-brand TZ 显示是既有 FR（12b/13c），本批沿用本地格式。
