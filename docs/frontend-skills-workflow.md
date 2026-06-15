# 前端研发 Skills 调用顺序参考

> 本文档基于对 `web/` 的调研整理，给出前端研发在本项目中按开发生命周期调用 skills 的推荐顺序。
> 配套阅读：`web/SKILLS.md`（技能清单总览）。

---

## 一、项目背景速览

- **Monorepo**：pnpm 9.15 + Turborepo
  - apps：`brand`（品牌商家）/ `app`（C 端）/ `admin`（平台管理，带 Electron）
  - packages：`api`（共享 API 客户端 + 类型）/ `types` / `config`（Tailwind/ESLint）/ `admin-system`（组件库）
- **技术栈**：Next.js 15（App Router）+ React 19 + TypeScript 5.7 + Tailwind v4 + Zustand + TanStack Query + React Hook Form / Zod
- **既有流程产物**：`web/docs/superpowers/` 下已有 `specs/`（设计）与 `plans/`（实现计划）先例 —— 团队已在用「先 spec 后 plan 再实现」的流程

> ⚠️ 注意：`web/SKILLS.md` 列出的部分名字（如 `next-best-practices`、`tailwind-design`、`state-management`、`component-library`）是**理想清单**，本机实际安装的 skill 名称不完全一致。下表已映射到**真实可用的 skill 名**。

---

## 二、按开发生命周期的 Skills 调用顺序

| 阶段 | 何时用 | 调用的 skill | 作用 |
|---|---|---|---|
| **0. 厘清需求** | 接到模糊的功能 | `brainstorming` | 新功能/组件动手前先跑，挖意图和边界 |
| **1. 写需求** | 需求要交付/对齐 | `prd-generator`（中文 PRD，含字段表/校验/状态流转）→ `to-issues`（拆 issue） | 沿用 `docs/superpowers/specs` 习惯 |
| **2. 出设计** | 要先看界面 | `wireframe-prototyping` / `wireframing`（低保真）→ `design-taste-frontend`（高质量 UI）→ `refactoring-ui` | SKILLS.md 里 `frontend-design` 的真实替身 |
| **3. 定方案** | 编码前对齐技术方案 | `writing-plans` | 产出多步执行计划，存到 `docs/superpowers/plans` |
| **4. 写代码** | 实现时随调 | `vercel:nextjs` + `vercel:react-best-practices` + `vercel:shadcn`；缓存用 `vercel:next-cache-components`；路由/中间件用 `vercel:routing-middleware`；构建用 `vercel:turbopack` | 对应 SKILLS.md 的 `next-best-practices` 等 |
| **5. 守质量** | 写完/重构时 | `clean-code` → `refactoring-patterns` → `software-design-philosophy` / `clean-architecture` | 命名、拆函数、模块边界 |
| **6. 测试** | 关键逻辑 | `tdd`（Red-Green-Refactor）；E2E 走项目已配的 Playwright | |
| **7. 验证** | 改完确认能跑 | `run`（起 app 看效果）→ `verify`（验证行为符合预期） | |
| **8. 审查收尾** | 提交前 | `code-review`（正确性+质量）→ 修复 → 提交；排错用 `diagnose` | |

---

## 三、常见链路

### 1. 新增一个前端功能（完整）

```
brainstorming → writing-plans → design-taste-frontend
  → vercel:nextjs / vercel:react-best-practices / vercel:shadcn（边写边调）
  → clean-code → tdd → run → verify → code-review
```

### 2. 纯样式/组件微调（精简）

```
design-taste-frontend → vercel:shadcn → verify → code-review
```

### 3. 需求驱动（从想法到落地）

```
brainstorming → prd-generator → to-issues → writing-plans → （进入实现链路）
```

---

## 四、SKILLS.md 名称映射对照

| SKILLS.md 中的名字（理想） | 本机真实可用的 skill |
|---|---|
| `next-best-practices` | `vercel:nextjs` |
| `next-cache-components` | `vercel:next-cache-components` |
| `frontend-design` | `design-taste-frontend` / `refactoring-ui` |
| `component-library` | `vercel:shadcn` |
| `state-management` / `form-handling` / `api-integration` | （暂无独立 skill，写代码时并入 `vercel:react-best-practices`） |
| `tailwind-design` / `responsive-design` | （暂无独立 skill，用 `design-taste-frontend`） |
| `git-commit` / `review` | `code-review` |

> 建议后续将 `web/SKILLS.md` 校正为本机真实可用名称，避免调用时找不到 skill。
