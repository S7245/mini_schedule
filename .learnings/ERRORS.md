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

