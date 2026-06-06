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

## 2026-06-06 Batch 5 Staff / Course / Entitlement CRUD 复用清单

Batch 4 落地后，Batch 5 接 staff / course_category / course_template / entitlement_template / class_session 的 CRUD 时，**先盘点能直接复用什么，再动笔**。

### 直接 import 即可的组件

- `apps/brand/components/common/confirm-dialog.tsx` —— 删除/停用/跳过通用确认，`description` 接 ReactNode，参数齐。**所有 Batch 5 destructive action 都用它**，不要再开 alert-dialog。
- `apps/brand/components/locations/location-status-toggle.tsx` —— 复制改名为 `staff-status-toggle.tsx` 等，替换 hook + 文案 + 颜色（active/inactive 用 amber/green，published/archived 之类用 blue/slate）。**不要装 shadcn switch**。
- `apps/brand/components/onboarding/wizard-shell.tsx` —— 直接 import `WizardShell + ONBOARDING_STEP_KEYS/LABELS/ROUTES/SKIPPABLE_STEP_KEYS`，新 step page 套这个 shell + 自己的业务表单。
- `apps/brand/components/onboarding/step-placeholder.tsx` —— 上线某个 step 时把对应 STEP_HINTS 里那条删掉、改写 step 页内容；其余 step 仍走 `[stepKey]/page.tsx` 的 placeholder。

### 直接复制 + 替换 schema 的组件

- `apps/brand/components/locations/location-form-dialog.tsx` —— Create/Edit 复合 Dialog，**Batch 5 的 staff/course/entitlement/class_session 表单都按这个模板**：
  1. 顶部 zod schema + `type Form = z.infer<...>`
  2. `useCreateBrandX / useUpdateBrandX` 两个 mutation
  3. `mapApiError(err)` switch 把后端 code → 中文文案
  4. QUOTA_EXCEEDED / SUBSCRIPTION_RESTRICTED 这两类同时 `toast.error + setApiError`，其他错误只 inline
  5. `useEffect([open, initial], () => reset(...))` 在 open 时 hydrate

### 必须新写的部分

- 每个资源在 `packages/api/src/` 新建一个文件（例：`staff.ts`），按 `locations.ts` 抄结构：
  - `xxxQueryKeys.list / detail`
  - 5 个 raw fn：`listX / getX / createX / updateX / updateXStatus / deleteX`
  - 5 个 hook：`useBrandXs / useBrandX / useCreateBrandX / useUpdateBrandX / useUpdateBrandXStatus / useDeleteBrandX`
  - mutation onSuccess 统一 `invalidateQueries({ queryKey: ['brand-xs'] }) + invalidate onboarding status`
- `packages/api/src/errors.ts` 加新的 ErrorCodes 常量（STAFF_NOT_FOUND / COURSE_QUOTA_EXCEEDED 之类，与后端对齐）
- `packages/types/src/index.ts` 加 `Staff / CreateStaffInput / UpdateStaffInput / StaffStatus` 类型块

### 列表 page 结构（onboarding step 内）

照 `onboarding/locations/page.tsx`：
```tsx
const [dialogOpen, setDialogOpen] = useState(false)
const [editing, setEditing] = useState<T | null>(null)
const [pendingDelete, setPendingDelete] = useState<T | null>(null)
// 裸 shadcn <Table>，不要 ResourceListPage
// footer: 上一步 + 下一步（hasXxxCompleted gate）
```

### 列表 page 结构（独立菜单项 `(protected)/staff/page.tsx`）

如果 Batch 5 给 staff 单独加菜单项："日常管理页"才上 `@mini-schedule/admin-system/ResourceListPage + DataTable`，能直接接入 FilterBar / URL 同步。Onboarding step 页和独立菜单页**共用 FormDialog + StatusToggle + ConfirmDialog**，顶层 page 各写各的。

### 路由命名约定（保持一致）

- onboarding 内：`/onboarding/locations`、`/onboarding/staff` —— 路径用资源名复数小写
- 独立菜单项：`/locations`、`/staff` —— 同名，避免心智割裂
- 动态 placeholder：仍走 `/onboarding/[stepKey]/page.tsx`，上线某 step 时把 hardcoded path 加进去就行

### 顺手做的小事

- `apps/brand/app/(protected)/locations/page.tsx`（独立菜单门店管理页）目前没建，Batch 5 顺手补一下，沿用上面"独立菜单项"结构
- onboarding 上线某 step 时同步从 `step-placeholder.tsx` 的 `STEP_HINTS` map 删掉对应键，避免误用
- QUOTA_EXCEEDED 文案目前写死"请联系平台升级套餐"，后端实际返回了 `{current, max}` —— 可以改成 `已用 ${current}/${max}，[升级套餐]` inline 链接，做了能直接复用到 staff/course 配额错误上
