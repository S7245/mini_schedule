# PRD: 前端 Monorepo 初始化

## Problem Statement

后端 API（三端 Gin 实例）已搭建完毕，但缺少对应的前端界面供品牌商家、C 端用户和平台管理员使用。需要一个统一的前端代码仓库来开发和维护三个面向用户的界面，同时为未来移动端和小程序预留架构能力。

## Solution

在 `web/` 目录下建立 pnpm + Turborepo Monorepo，包含三个 NextJS App Router 应用（brand/app/admin），共享配置和 API 类型定义层。MVP 阶段上线 Web 端，架构上预留 Taro 小程序和 Expo 移动端的接入点。

## User Stories

1. 作为品牌管理员，我想通过手机号+密码登录品牌后台，以便管理我的品牌和用户
2. 作为品牌管理员，我想查看和管理 C 端用户列表（CRUD），以便维护学员信息
3. 作为品牌管理员，我想创建、编辑、发布/下架健身课程，以便向用户提供训练内容
4. 作为品牌管理员，我想查看本品牌下的训练记录，以便跟踪学员的训练情况
5. 作为 C 端用户，我想通过微信授权登录，以便快速进入我的健身账户
6. 作为 C 端用户，我想查看已发布的课程列表和详情，以便选择适合我的训练计划
7. 作为 C 端用户，我想记录我的训练数据（时长、消耗），以便跟踪我的健身进度
8. 作为 C 端用户，我想查看和更新个人资料，以便保持账户信息准确
9. 作为平台管理员，我想通过账号密码登录管理后台，以便管理平台内容
10. 作为平台管理员，我想创建和管理品牌入驻信息（CRUD + 启用/禁用），以便审核和维护平台品牌库
11. 作为平台管理员，我想创建和管理管理员账号，以便分配运营和客服权限
12. 作为品牌管理员，我想收到系统级通知（即使关闭浏览器），以便及时获知新预约和重要消息（P1，Electron）
13. 作为开发者，我想自动生成 TypeScript 类型定义，以便前后端 API 变更时编译期发现不一致

## Implementation Decisions

### Monorepo 架构

- **工具链**: pnpm workspace + Turborepo
- **目录结构**:
  ```
  web/
  ├── turbo.json
  ├── pnpm-workspace.yaml
  ├── package.json              # 根级依赖 (turbo, typescript)
  ├── apps/
  │   ├── admin/                # 平台管理后台 (NextJS App Router, 端口 3001)
  │   ├── brand/                # 品牌商家后台 (NextJS App Router, 端口 3002)
  │   └── app/                  # C 端用户 Web (NextJS App Router, 端口 3003)
  └── packages/
      ├── api/                  # API 客户端、自动生成类型、TanStack Query hooks
      ├── config/               # 共享 Tailwind/ESLint/PostCSS 配置 + 设计 tokens
      └── types/                # 手动维护的共享 TypeScript 类型（非 API 相关）
  ```

### 应用端技术选型

| 应用 | 框架 | 路由模式 | 部署形态 |
|------|------|----------|----------|
| admin | NextJS 14+ App Router | `app/` 目录 | MVP 纯 Web |
| brand | NextJS 14+ App Router | `app/` 目录 | MVP 纯 Web, P1 Electron |
| app | NextJS 14+ App Router | `app/` 目录 | MVP 纯 Web, P1 Taro 小程序, P2 Expo RN |

### API 通信策略

- **环境变量**: 各端独立 `.env.development` / `.env.production`，变量 `NEXT_PUBLIC_API_URL`
  - brand → `http://localhost:8081`
  - app → `http://localhost:8082`
  - admin → `http://localhost:8083`
- **本地开发代理**: 各端 `next.config.ts` 通过 `rewrites` 将 `/api/*` 代理到对应后端端口，避免 CORS
- **生产环境**: 直接配域名，不走代理
- **请求封装**: `packages/api/src/client.ts` 统一 fetch 封装，返回 `{code, message, data}` 格式

### API 类型自动生成

- **后端**: Gin + swaggo 注解生成 `docs/swagger.json`
- **前端**: `packages/api` 使用 `openapi-typescript` 读取 `swagger.json` → 自动生成 `generated/api.d.ts`
- **TanStack Query hooks**: 手动编写，使用自动生成的类型作为参数和返回值
- **npm script**: `"generate": "openapi-typescript ../../backend/docs/swagger.json -o ./generated/api.d.ts"`

### 认证与存储

- **JWT 存储**: `localStorage` + Zustand `persist` 中间件
- **JWT payload**: `user_id`, `user_type` (`brand`/`app`/`admin`), `role`, `brand_id` (仅品牌端), `exp`
- **Token 刷新**: TanStack Query `onError` 拦截 401 → 调用 refresh → 更新 Zustand store → 重试
- **Zustand auth store 接口**:
  ```typescript
  interface AuthState {
    accessToken: string | null
    refreshToken: string | null
    user: { id: string; userType: string; role: string; brandId?: string } | null
    login: (tokens: Tokens, user: User) => void
    logout: () => void
  }
  ```

### 状态管理职责分工（方案 A 严格分工）

| 职责 | 工具 | 示例 |
|------|------|------|
| 服务端数据 | TanStack Query | 课程列表、用户信息、训练记录 |
| 客户端状态 | Zustand | JWT 会话、UI 主题、侧边栏开关、多步骤表单 |
| 表单验证 | React Hook Form + Zod | 登录表单、创建课程表单 |

- **Zustand store 按领域拆分**: `useAuthStore`、`useUIStore` 等
- **TanStack Query 全局配置**: `staleTime: 5min`, `gcTime: 30min`, `retry: 1`, `refetchOnWindowFocus: false`

### 路由鉴权（B+C 组合）

- **middleware.ts**: 最外层拦截，检查 `accessToken` 是否存在，不存在则重定向到 `/login`
- **`(protected)/layout.tsx`**: 细粒度鉴权（VIP 权限、brand_id 匹配等），因为 middleware 拿不到完整的角色信息
- **路由分组**:
  ```
  app/(auth)/login/page.tsx        # 登录页
  app/(protected)/dashboard/page.tsx  # 受保护页面
  ```

### UI 组件库

- **shadcn/ui**: 各端独立安装（`npx shadcn@latest add`），不共享 `packages/ui`
- **共享配置**: `packages/config/` 提供 Tailwind 基础配置、设计 tokens（颜色、字体、间距）、ESLint 规则
- **响应式设计**: Tailwind CSS，移动端优先

### 错误处理（拦截器 + 可覆盖）

- **统一拦截器**: fetch 封装中解析 `{code, message, data}`，非空 `code` 时自动 `toast.error(message)`
- **`silent` 选项**: 请求可传 `{ silent: true }` 跳过自动 Toast，由调用方自行处理
- **错误码映射**: `packages/api/src/errors.ts` 定义前端错误码枚举，与后端字符串错误码对应

### Turborepo 任务配置

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "lint": { "dependsOn": ["^lint"] },
    "test": { "dependsOn": ["build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

### 商家后台 Electron（P1 预留）

- MVP 阶段 brand 端只做 Web 应用
- 预留 `apps/brand/electron/` 目录和 `electron-builder.json` 配置骨架
- P1 阶段实现：Electron 主进程 SSE 连接 + 系统通知 + 托盘图标

### 用户端多平台预留（P1/P2）

- MVP: `apps/app/` NextJS Web
- P1 预留: `apps/app-mini/` Taro 小程序骨架
- P2 预留: `apps/app-mobile/` Expo React Native 骨架
- 共享层: `packages/api`、`packages/config`、`packages/types` 三端通用

## Testing Decisions

### 测试策略：方案 B（E2E + 核心单元）

- **E2E 测试（Playwright）**: 每个端跑关键用户流程
  - 登录流程（brand/admin/app 各一个）
  - 核心 CRUD（品牌管理品牌、管理员创建品牌、用户查看课程）
  - 路由鉴权（未登录跳转、无权访问 403）
- **单元测试（Vitest）**: 纯函数和核心逻辑
  - API 客户端错误处理、拦截器逻辑
  - 工具函数（日期格式化、权限判断、类型转换）
  - 核心 hooks（useAuthStore 的 login/logout 行为）
- **组件测试**: MVP 阶段不单独测，组件正确性由 E2E 覆盖

### 测试文件组织

```
apps/brand/
├── __tests__/
│   ├── e2e/          # Playwright specs
│   └── unit/         # Vitest specs
└── playwright.config.ts

packages/api/
└── __tests__/
    └── unit/         # Vitest (client, errors, hooks)
```

## Out of Scope

- **P1 阶段（后续迭代）**:
  - 商家后台 Electron 打包（macOS/Windows 桌面应用 + 系统通知）
  - Taro 小程序端（微信小程序）
  - Expo React Native 移动端（iOS/Android）
  - 后端 Swagger/swaggo 注解完善（MVP 先手动写核心类型，后续补全自动生成）
  - 品牌内部 RBAC 子账号系统
  - 消息队列、OpenTelemetry 全链路追踪
- **P2 阶段**:
  - 微信登录真实 API 对接（目前后端为 dev 占位）
  - 计费/配额系统
  - AI 动作识别、社区功能
- **始终不在范围内**:
  - `packages/ui` 共享组件库（各端独立安装 shadcn/ui）
  - 数据库迁移（已存在且不在前端范围内）
  - 后端业务逻辑（已存在于 backend/）

## Further Notes

1. **后端现状**: backend/ 已有三端 Gin 实例 + Clean Architecture + Google Wire + 数据库迁移，但尚无 Swagger/OpenAPI 文档。MVP 阶段前端可先手动定义核心 API 类型，后端补上 swaggo 注解后再接入自动生成。
2. **Docker**: 用户已有可用的 PostgreSQL 和 Redis，docker-compose.yml 仅作参考。
3. **CI/CD**: GitHub Actions 负责 lint、test、build，具体 workflow 配置在 P1 阶段完善。
4. **Monorepo 与后端独立**: `web/` 和 `backend/` 是完全独立的代码仓库，各自有各自的 CI pipeline。通过 API 通信，不共享代码。