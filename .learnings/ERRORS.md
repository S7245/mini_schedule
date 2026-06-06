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
