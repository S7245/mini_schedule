## 2026-05-27

- `pnpm --filter @mini-schedule/admin dev` 在 Codex sandbox 内监听 `0.0.0.0:3001` 会触发 `listen EPERM`；启动本地预览服务需要提升权限。
- Admin 前端构建会提示 Next.js 因用户目录存在额外 lockfile 而推断 workspace root 到 `/Users/liushan`，当前不阻断 build。

## 2026-05-28 skill routing memory

- Before web implementation, use `web/SKILLS.md` as the local skill router.
- Select only skills that are available in the current session; if a listed skill is unavailable, use the closest available local frontend/design/testing skill.
- For the current Next.js monorepo, default shortlist is `next-best-practices`, `frontend-design`, `clean-code`, `refactoring-patterns`, `state-management`, `api-integration`, `form-handling`, and `testing-strategy`.
