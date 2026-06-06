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
