## 2026-06-06 Batch 4 前端待办的预期

Batch 4 在 `apps/brand` 大量加页面，先把预期落在这里，避免后续 subagent 重复设计：

### 4.1 Brand 初始化向导骨架

- 路径：`apps/brand/app/(protected)/onboarding/` 下落多步骤路由（建议 `step-1`、`step-2`、`step-3` 或 `[step]/page.tsx`），首登成功后由 `(protected)/layout.tsx` 检查 `user.onboarding_completed` 字段决定是否强制跳转。
- 复用 `components/signup/page-shell.tsx` 的步骤进度条思路，但**抽到 `components/onboarding/wizard-shell.tsx`**，参数化 `steps: string[]` + `currentStep`，让 signup 和 onboarding 都用。如果 admin-system 包里能放就放共享包。
- 跨步骤数据走 `sessionStorage['brand-onboarding']`，提交时由最后一步聚合调用后端 `/api/v1/brand/onboarding/complete`（待后端确认接口名）。
- 表单严格 RHF + Zod，提交错误 inline 显示，参考 signup `apiError` 模式。
- 完成后跳 `/dashboard` 并 `router.refresh()` 刷新 layout 的 onboarding 判断。

### 4.2 Location CRUD

- 列表页 `apps/brand/app/(protected)/locations/page.tsx`：
  - 优先用 `@mini-schedule/admin-system` 的 `ResourceListPage` + `DataTable`。
  - hooks 放 `packages/api/src/brand.ts`：`useBrandLocations(page, pageSize)`、`useBrandLocation(id)`、`useCreateBrandLocation`、`useUpdateBrandLocation`、`useDeleteBrandLocation`、`useToggleBrandLocationStatus`（PATCH `/status`，参考 `useUpdateCourseStatus`）。
  - queryKey: `['brand-locations', page, pageSize]`。
- 详情/编辑：`locations/[id]/page.tsx`，复用列表用的 LocationForm 组件。
- 新增：弹 `Dialog`（shadcn `@/components/ui/dialog` 已存在）放 LocationForm，**不要单开 `/locations/new`**，与 Course/User 风格保持一致。
- 启用/停用：列表行右侧 action 用 Switch（shadcn `switch` 没装，需要先 `npx shadcn add switch`）。乐观更新通过 React Query mutation 的 `onMutate` + `setQueryData` 实现，回滚走 `onError`。
- 类型：在 `packages/types/src/index.ts` 加 `Location`、`CreateLocationInput`、`UpdateLocationInput`，与后端 DTO 对齐后再写 hook。
- 导航：`brandNavItems` 加「门店」项（`MapPin` icon from lucide-react），插在「学员管理」之前；`brandNavGroups` 把它放进「品牌运营」组。

### 4.3 衍生需求 / 建议先评估

- 全局 ConfirmDialog 组件（删除/停用确认），目前每页自己写不优雅，建议放 `@mini-schedule/admin-system` 暴露。
- 列表筛选 + 搜索的 URL 同步（`useSearchParams`）：admin-system 已有 `FilterBar`，确认能否接管 querystring，否则提一个改造请求。
- brand app 缺 ESLint flat config，Batch 4 加完页面后建议补一份（参考 admin app 的配置）。
