## 2026-06-06 Pre-Batch-4 已存在但未记录的坑

为 Batch 4 subagent 提前记下来，省得再撞一次。

### Lint / 构建

- `pnpm --filter @mini-schedule/brand lint` 跑的是 `next lint`，Next 15 已 deprecated 进入交互模式；CI 等价命令 = `tsc --noEmit`。**Batch 4 校验代码用** `pnpm --filter @mini-schedule/brand exec tsc --noEmit`。
- brand app 没有根级 `eslint.config.*`，直接跑 `eslint .` 会因找不到 flat config 报错。

### Next.js workspace 推断

- 启动 brand dev 时 Next 会警告「inferred workspace root = `/Users/liushan`」，因为 user home 有额外 lockfile。不阻断构建，可忽略；要消除需在 `next.config.ts` 里显式设 `outputFileTracingRoot`（暂未做）。

### Tailwind v4 跨包扫描

- `apps/brand/app/globals.css` 通过 `@source "../../../packages/admin-system/src/**/*.{ts,tsx}"` 把 admin-system 的 class 纳入 JIT。**新增其他共享包（如以后抽 onboarding-shell）**记得同步加 `@source` 行，否则 prod build 会丢样式（dev 因为热更新看不出来）。

### React Query 与 sessionStorage 配合

- React Query `staleTime` 默认 5 分钟。signup 流程里如果用户回退到 step 1，缓存可能还在，但 `sessionStorage['signup-form']` 已被覆盖，导致 UI 状态对不上。Batch 4 onboarding 多步骤切换时，**进入每一步先 `sessionStorage.getItem` 重新 hydrate 表单 defaultValues**，不要靠 React Query 自己缓存表单。

### 同源代理 + auth cookie 双轨

- client.ts 浏览器端走 Next.js rewrite（`/api/v1/brand/*`），但 middleware 用 cookie `brand_access_token` 做路由守卫 —— **cookie 是 `auth.ts` login 成功后自己 `document.cookie =` 写的**，不是后端 Set-Cookie。如果 Batch 4 新增的页面在 onboarding 完成前 cookie 丢失（如手动清浏览器），middleware 会把人踢回 `/login`。调试 onboarding 流程时记得检查 cookie + `localStorage['auth-storage']` 是否同步。
- 同样：admin 路径（`/api/v1/admin/*`）走 cookie auth、不带 Bearer；brand/app 走 Bearer + 路由守卫 cookie。**别在 brand 的 hook 里 import admin hook**，签名不一样。

### shadcn 增量安装

- `components.json` 用 `style: new-york`、`baseColor: slate`、alias `@/components`、`@/lib/utils`、CSS variables。Batch 4 新加 shadcn 组件（如 `switch`、`alert-dialog`）请在 `apps/brand` 目录内跑 `npx shadcn add`，**不要在 monorepo 根目录跑**，否则会装错位置。

## 2026-06-06 Batch 4 落地踩到的新坑

### Next 15 `useSearchParams` prerender bailout

- `(auth)/login/page.tsx` 接入 `next=` 参数后，dev 没报错，**prod build 直接 fail**：`useSearchParams() should be wrapped in a suspense boundary at page "/login"`。修法：把整个 page 内容抽到 `LoginPageInner` 函数，默认 export 用 `<Suspense fallback={...}><LoginPageInner /></Suspense>` 包一层（见 commit `3d46fbb`）。Batch 5 任何 page-level 用 `useSearchParams / useParams` + 同步读 query 的页，都按此包 Suspense。

### DialogDescription 嵌套字段名要用 `asChild`

- `ConfirmDialog.description` 接 `ReactNode`，里面常带 `<span className="font-medium">` 高亮字段名。**shadcn `DialogDescription` 默认 render `<p>`，里面再放 `<div>` 会 hydration warning**。修法：用 `<DialogDescription asChild><div>...</div></DialogDescription>`（见 `confirm-dialog.tsx`）。Batch 5 复用 ConfirmDialog 时如果只传纯字符串可省略，但传 JSX 务必保留 asChild。

### onboarding/layout 三 effect 串联可能短促闪现 loading 文案

- `profileQuery` 和 `statusQuery` 是并行触发，两个都 isLoading 时显示"正在加载初始化向导..."。如果 brand status=cancelled 但 status query 还在飞，**会先闪一下加载文案再 replace 到 /signup/plan**。当前可接受，但若 Batch 5 有更严格的"不能看到 onboarding shell 一帧"需求，需把 redirect effect 改成 `useLayoutEffect` 或 SSR 校验。

### `/locations` 路径是步骤 2 而不是日常管理页

- `apps/brand/app/(protected)/onboarding/locations/page.tsx` 是 onboarding step 内的 CRUD，**它不是"日常门店管理页"**。Batch 5 若加 `apps/brand/app/(protected)/locations/page.tsx`（独立菜单项），注意两者要共用 `LocationFormDialog / LocationStatusToggle / ConfirmDialog` 组件，但不能直接 import 步骤页 —— 把这三个组件的位置（`components/locations/`、`components/common/`）已经摆对了，复用就是 import 三个文件 + 自己写一个 `ResourceListPage` 顶层。

## 2026-06-06 Batch 5 验收期坑

### 后端 `json:",omitempty"` 把数组字段整个吞掉，前端 TS 类型撒谎

`/staff/[id]` owner 进入直接 white-screen：`staff.location_assignments.map(...)` 报 `Cannot read properties of undefined`。根因是后端 DTO 字段 tag 写了 `json:"location_assignments,omitempty"`，owner 的 assignments 是空切片时序列化整段消失。前端 TS 类型 `Staff` 里写的是 `location_assignments: LocationAssignment[]`，编译期看不出来，运行时只在 owner 这种边角 case 触发。

**规则**：
- 前端类型涉及数组时一律 `?? []` 兜底，**不管后端"应该"返什么**——后端可能在任何 release 加 omitempty。`rowsFromStaff` / `useFieldArray` 初始化 / `.map()` 前都加。
- 后端 review checklist：DTO 数组字段**禁用** `omitempty`，统一返 `[]`（已在 d0dd639+1 patch），列表类型不该有"该字段不存在"和"该字段是空数组"两种语义。
- 当前 a3af71a 已在 `staff-role-assignment-editor.tsx` / `staff-location-assignment-editor.tsx` 加防御；Batch 6 新接口数组字段一并加。

### Gin handler 绑 string 但前端发 `[]string`，INVALID_REQUEST 无根因

教练档案启用时 `specialties`/`certificates` 前端按 `string[]` 发，后端 handler 的 BindJSON struct 写的是 `string`，Gin 解码失败统一吐 `INVALID_REQUEST: 请求参数错误`，看不出是哪个字段、什么类型不对。前端 zod 也通过了（自己跟自己对齐）。

**规则**：
- 前后端类型对齐必须放 contract review checklist：联调首个端到端跑通前，**先用 curl 灌一个真实 payload 验证后端期望**，确认 `Content-Type: application/json` 下后端真实解出来的字段类型。
- INVALID_REQUEST 排查口诀：前端 zod 通过 + 后端报 INVALID_REQUEST = 八成是 handler bind 结构体字段类型与前端发送类型不匹配（数组 vs 字符串、number vs string、嵌套对象 vs 扁平字段）。
- Batch 6 起，packages/types 与后端 DTO 同步在 PR description 列对照表，单边改字段类型必须打 break 标签。

## 2026-06-11 Batch 6 RBAC enforcement 验收期坑

### 🔴 跨用户 React Query 缓存泄漏（commit 69f513c，重磅）

**现象**：用户 A 登出、用户 B 登录后，B 看到的侧边菜单 / 权限按钮 enable 状态仍是 A 的；硬刷新才恢复正常。

**根因**：`/me/permissions` 的 queryKey 是 `['brand-me-permissions']`（见 `packages/api/src/me.ts` `meQueryKeys.permissions()`）——**静态、不带 user id**。而原本：
- `logout()`（`packages/api/src/auth.ts`）只清 Zustand auth state（token / user）+ 路由守卫 cookie，**没碰 React Query cache**；
- 登录 `onSuccess` 只 `invalidateQueries(['auth'])` 之类，**没清整个 cache**。

结果 A 的 `['brand-me-permissions']` 缓存条目（含 permissions / data_scope）在 staleTime(60s) 内原封不动被 B 复用，菜单/按钮全是 A 的视角。

**修复**：三端登录 `onSuccess`（`useBrandLogin / useAdminLogin / useAppLogin`）+ 登出处（`(protected)/layout.tsx` 的 `onLogout`）**统统 `queryClient.clear()`**，整库清空而非 invalidate 单 key。在 login onSuccess 清是为了防"A 没显式登出、直接在登录页登 B"的路径也干净。

**规则（会话边界铁律）**：**会话边界（登录成功 / 登出）必须 `queryClient.clear()` 清空整个 query cache，不能只 invalidate 某几个 key。** invalidate 只标记 stale 仍可被读到旧值；clear 才是真正逐出。

**Pending exposure（必查）**：所有**非 user-keyed**（queryKey 不含 user/brand id）的缓存都有同款跨用户泄漏风险——目前已知：`['brand-me-permissions']`、staff 列表、门店列表、以及后续任何 brand-scoped query。
- 已修：上述四处 `queryClient.clear()` 覆盖了**已存在**的所有 query。
- **约束**：Batch 7 起**凡新增 brand-scoped / 任何非 user-keyed query**，都自动受此规则保护（因为会话边界 clear 是全量的），但**反过来不要在登出/登录处改成"只清某些 key"**——一旦改成精确清理，新加的 query 就会重新泄漏。要么保持全量 clear，要么给每个 query 的 key 带上 user/brand id（二选一，别半途）。

### disabled 按钮的原生 title / 直挂 tooltip 永不弹（commit e71781d）

**现象**：给 disabled 的 shadcn `Button` 加 `title="权限不足"`（或把 Radix `TooltipTrigger` 直接 asChild 套在 disabled Button 上），hover 完全无反应。

**根因**：disabled 元素不派发指针事件；shadcn `Button` 还额外带 `disabled:pointer-events-none`，触发器收不到 hover。

**修复**：抽 `components/ui/hint.tsx`，Radix 触发器挂到**非 disabled 的 `<span>`** + span 上 `[&_:disabled]:pointer-events-none` 把内部 disabled 子元素的指针事件再屏一层，hover 落 span 上正常弹。详见 LEARNINGS 同批"disabled 控件的 tooltip"。**规则**：任何 disabled 控件要解释原因，一律包 `Hint`，**禁止 `title=` 或把 tooltip 触发器直接挂 disabled 元素**。

**Pending exposure**：现存散落各处的 disabled 控件（Batch 4/5 的 LocationStatusToggle、StaffStatusToggle、各 CRUD 提交按钮）如果以后要加"为何禁用"提示，别走 title，统一改 `Hint`。

### 菜单乐观显示 vs 按钮 fail-closed 方向相反，别套反（`(protected)/layout.tsx`）

**坑点**：perms 还在 loading 时，菜单层 `if (permsLoading) return true` **乐观显示全部**（防 sidebar 闪烁/空出），但按钮层是 **fail-closed disabled**（`has()` loading 返 false）。这两层乐观/保守方向**故意相反**——菜单乐观靠 button-level guard 兜底，短窗口内点进去也是 disabled，不越权。

**易错**：如果有人"为了一致"把菜单也改成 loading 期隐藏，会全屏闪烁；或把按钮也改成 loading 期 enable，会在权限未知时放出可点的越权按钮吃 403。**两层方向不能统一，记死。**


## 2026-06-12 Batch 7

- **删员工后列表 stale 须硬刷（已修）**：详情页删除 → `router.push('/staff')`，列表 query 卸载，默认 `refetchType:'active'` 不刷新它 → 回列表仍显示已删员工。修：`invalidateStaff` 用 `refetchType:'all'`（commit `e113d72`）。Pending exposure：其它"详情页 mutate → 导航回列表"的路径（course/user 等）若同样依赖 active 失效，也会 stale，值得排查。
- **`.next` 缺 lucide-react vendor-chunk 致 /roles 整页 Runtime ENOENT（验收期，环境问题）**：dev server 增量构建偶发 vendor-chunk 缺失，重启 :3002 解决。非 Batch 7 代码问题。
- **zustand persist 水合竞态：硬 URL 直达深链瞬时跳 /dashboard（既有，非本批）**：persist 未水合时 protected layout 瞬时判未登录。点侧栏软导航正常。FR 已记，建议等 `hasHydrated` 再做鉴权判断。

## 2026-06-12 Batch 8

- **所有 DELETE 静默失败（已修 `fe27ace`）**：`client.ts` 无条件 `response.json()`，后端 204 空 body 抛 SyntaxError，请求 reject → 弹窗不关 + toast「删除失败」，但后端实际已删。修：先 text() 判空。Pending exposure：任何返 204/空 body 的接口（未来 PUT/POST 若返 204）都曾受影响，全线受益。
- **硬 URL 直达 protected route 被弹走（已修 `5b5001d`）**：zustand persist 未水合 → 守卫误判未登录。修：useAuthHydrated 门控。Pending exposure：**app/admin 两端 protected layout 大概率同款竞态，本批未改**。
- **prod build 报 `Cannot find module 'react'`（已修）**：packages/api 新增直接 react import 但未声明依赖；dev/e2e 不暴露（dev 不全量 typecheck）。修：package.json 补 react peer+dev。教训：验收流程加一步 `pnpm --filter <app> build`。

## 2026-06-16 Batch 11

### 排课教练下拉恒空（根因在后端，但前端先暴露）
`packages/api/src/instructor.ts` 的 `useSchedulableInstructors` 调 `GET /instructors?schedulable=true`，后端 Batch 11 原未实现该路由 → 404 → 下拉空 → 无法排课。后端补端点后恢复（详见 backend `.learnings/ERRORS.md`）。前端侧教训：api client 写 `ASSUMPTION (backend must match)` 的端点，要么后端同批落地，要么前端别静默依赖——下拉空时给「暂无可排课教练，请先到员工管理启用教练档案」之类兜底文案（本批已对 courses/locations 空态做了，instructor 下拉可补）。

### 课程 dialog 默认全选门店回填 bug（code-review，commit ef8f974）
见 LEARNINGS「打开时默认全选用 ref」。effect keying on locationIds.length → create 取消最后一个被自动回填，删不掉。修：useRef 一次性默认。

### 复跑环境踩坑（务必照做）
- 前端 filter 用**包名** `pnpm dev --filter=@mini-schedule/brand`；`--filter=brand` 报 "No package found"。
- stale `.next`：登录点击后不跳转、URL 变 `/login?phone=…&password=…`（DevTools 见 `_next/static/*` 404 → 不水合 → 表单退化成原生 GET 提交）。修：杀前端 → `rm -rf apps/brand/.next` → 重启 → 先 `curl /login` 预热。
- 冷编译：跑 e2e 前 `curl` 预热 /login 和目标页，避免 beforeAll 30s 超时。

## 2026-06-16 Batch 12a

### 新增 api 子模块忘记登记 package.json exports → 解析失败
见 LEARNINGS。新建 `src/location-resources.ts` 必须同步 `packages/api/package.json` 的 `exports`，否则 `pnpm build` 时 `@mini-schedule/api/location-resources` 模块解析不到。本批落地时一并加了，未踩坑，但作为新 api client 的固定步骤记录。

### ClassSession 类型加 location_resource_id/resource_name 要同步 list+detail 两个 interface
`ClassSessionListItem` 和 `ClassSession` 是两个独立 interface，后端两个端点都返了 resource_name，前端两个 type 都要补，否则 /schedule 表读 `s.resource_name` 类型报错或详情缺字段。

## 2026-06-17 Batch 12b

### eslint 无 react-hooks/exhaustive-deps 规则 → disable 注释反而报错
本仓 eslint 未启用 react-hooks 插件，写 `// eslint-disable-next-line react-hooks/exhaustive-deps` 会报「Definition for rule not found」error。正确做法：把依赖如实写进 deps 数组（既有 dialog 都是这么做的），不要加 disable 注释。
