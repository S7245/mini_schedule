# web 本地学习记录

本目录关联 `self-improving-agent` 的项目级记忆机制。

## 关联信息

- project: `/Users/liushan/Documents/zkw/mini_schedule/web`
- local memory: `/Users/liushan/Documents/zkw/mini_schedule/web/.learnings`
- skill router: `/Users/liushan/Documents/zkw/mini_schedule/web/SKILLS.md`

## 开发前技能选择规则

在 `/web` 开发前，如果需要使用 skills，先读取 `web/SKILLS.md` 的摘要，再选择当前会话实际可用的 skill。

常见选择：

- Next.js/React：`next-best-practices`、`frontend-design`
- UI 和设计系统：`frontend-design`、`tailwind-design`、`component-library`
- Monorepo 和包边界：`monorepo-management`
- 状态和 API：`state-management`、`api-integration`
- 表单和校验：`form-handling`
- 测试和质量：`testing-strategy`、`review`、`diagnose`
- 可访问性和性能：`accessibility-audit`、`performance-optimization`

## 文件用途

- `LEARNINGS.md`：记录前端项目经验、构建注意事项和可复用实践。
- `ERRORS.md`：记录 lint/build/dev server/API 联调失败和修复线索。
- `FEATURE_REQUESTS.md`：记录前端能力补齐或 skill 改进请求。

跨项目通用经验再考虑进入 `self-improving-agent` 全局 memory。
