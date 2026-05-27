## 2026-05-27

- `pnpm --filter @mini-schedule/admin dev` 在 Codex sandbox 内监听 `0.0.0.0:3001` 会触发 `listen EPERM`；启动本地预览服务需要提升权限。
- Admin 前端构建会提示 Next.js 因用户目录存在额外 lockfile 而推断 workspace root 到 `/Users/liushan`，当前不阻断 build。
