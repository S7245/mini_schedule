# Frontend Memory

前端项目现状与协作指南，供后续开发参考。

---

## 项目结构

```
web/
├── apps/
│   ├── admin/       # 超级管理员 Web（NextJS App Router，端口 3001）
│   ├── brand/       # 商家后台 Web（NextJS App Router，端口 3002，后续 Electron 打包）
│   └── app/         # C 端用户 Web（NextJS App Router，端口 3003）
├── packages/
│   ├── api/         # 共享 API 请求封装（TanStack Query hooks + http client）
│   ├── types/       # 共享 TypeScript 类型定义
│   └── config/      # 共享 Tailwind/ESLint 配置
├── package.json     # pnpm workspace 根
├── turbo.json       # Turborepo 构建编排
└── tsconfig.base.json
```

## 技术栈

| 组件 | 选型 |
|------|------|
| 框架 | NextJS 15 + React 19 + TypeScript |
| 路由 | App Router（`app/` 目录，`layout.tsx` + `page.tsx`） |
| UI | Tailwind CSS + shadcn/ui（手动 `add` 组件到 `components/ui/`） |
| 状态 | Zustand（认证）+ TanStack Query v5（数据请求） |
| 表单 | react-hook-form + Zod + @hookform/resolvers |
| Toast | Sonner |
| 构建 | Turborepo + pnpm workspace |
| 代码质量 | ESLint + Prettier |

## 三端端口与代理

| 应用 | 端口 | API 目标后端 | 代理规则 |
|------|------|-------------|----------|
| admin | 3001 | `:8083` | `next.config.ts` rewrites: `/api/*` → `localhost:8083/api/v1/admin/*` |
| brand | 3002 | `:8081` | `next.config.ts` rewrites: `/api/*` → `localhost:8081/api/v1/brand/*` |
| app | 3003 | `:8082` | `next.config.ts` rewrites: `/api/*` → `localhost:8082/api/v1/app/*` |

各应用在 `.env.development` 中配置 `NEXT_PUBLIC_API_URL` 指向对应后端。
生产环境不走代理，直接配域名指向后端。

## 认证策略

- 三端独立用户表（`admin_users` / `brand_users` / `app_users`）
- Zustand store（`@mini-schedule/api/auth`）持久化到 `localStorage`（key: `auth-storage`）+ NextJS middleware 读 cookie 做路由守卫
- JWT 存储在 `localStorage`，http client 自动附加 `Authorization: Bearer <token>`
- Admin 端：`middleware.ts` 拦截非 `/login` 路径，未登录重定向到 `/login?callbackUrl=...`
- `ProtectedLayout` 组件（`components/layout/protected-layout.tsx`）做客户端二次校验 + 侧边栏导航

## API 层

- `packages/api/src/client.ts`：统一 `http` 客户端（`fetch` 封装），后端响应格式 `{code, message, data}`，`code === null` 表示成功
- `packages/api/src/errors.ts`：`ApiErrorClass` 自定义错误
- `packages/api/src/admin.ts`：Admin 端 hooks（useBrands, useCreateBrand, useAdmins, useCreateAdmin 等）
- `packages/api/src/brand.ts`：Brand 端 hooks（useBrandUsers, useBrandCourses, useCreateBrandCourse 等）
- `packages/api/src/auth.ts`：三端登录 hooks（useBrandLogin, useAdminLogin, useAppLogin）+ `useAuthStore`

## 类型定义

- `packages/types/src/index.ts`：共享类型（Brand, AdminUser, BrandUser, AppUser, Course, TrainingRecord, PageRequest, PageResponse 等）
- API 请求 Input 类型（CreateBrandInput, CreateAdminInput, CreateCourseInput 等）也在 types 包中定义

## shadcn/ui 组件现状

三端当前已初始化的 shadcn 组件（位于各 app `components/ui/`）：
- button, card, dialog, input, label, select, table, textarea
- app 端额外有 tabs

**尚未初始化的常用管理后台组件**：badge, checkbox, switch, dropdown-menu, toast, avatar, separator, skeleton, pagination, sheet, breadcrumb, tooltip, popover, scroll-area, collapsible, calendar, form（shadcn form 组件）

## 页面现状

### Admin 端（/apps/admin）
- `(auth)/login/` — 登录页
- `(protected)/dashboard/` — 仪表盘（静态卡片，待接数据）
- `(protected)/brands/` — 品牌管理（表格 + Dialog 创建 + 分页 + 状态切换）
- `(protected)/admins/` — 管理员管理（表格 + Dialog 创建 + 分页）
- 侧边栏导航：概览 / 品牌管理 / 管理员管理（emoji 图标）

### Brand 端（/apps/brand）
- 基础骨架已搭建，页面待开发

### App 端（/apps/app）
- 基础骨架已搭建，页面待开发

## 协作指南

- **新增 shadcn 组件**：在对应 app 目录下执行 `npx shadcn@latest add <component>`，组件会复制到 `components/ui/`
- **新增 API hooks**：写到 `packages/api/src/` 下对应端文件中，导出给各 app 使用
- **新增类型**：写到 `packages/types/src/index.ts`
- **页面路由**：遵循 `app/(auth)/` 和 `app/(protected)/` 路由组模式
- **不要**跨端 import 页面组件，只有 `packages/` 下的包可以共享
- **商家后台 SSE**：后续 Electron 阶段再引入，目前 Brand 端暂不需要

## 其他注意事项

- 代码要标清注释，包括函数、结构体、变量等
- 代码要符合 Go 语言规范，如命名规范、代码格式等
- 代码要符合项目业务逻辑，如数据隔离、权限模型等
- 代码注释语言使用中文