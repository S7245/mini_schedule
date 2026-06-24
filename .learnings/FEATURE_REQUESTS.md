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

## 2026-06-06 Batch 6 待办（Batch 5 验收期沉淀）

### 抽 ResourceStatusToggle 泛型

- `LocationStatusToggle` + `StaffStatusToggle` 现在结构 95% 相同（hook 名 + 文案 + 颜色 token 不同），第三个 toggle（course / instructor / class_session）出现时就开抽。
- 设计：`<ResourceStatusToggle<T, S>>{ resource, statuses: [{value,label,color,confirmDesc}], mutation, getCurrentStatus }`；hook 由外部注入，组件只管 UI + Confirm。
- 位置：`apps/brand/components/common/resource-status-toggle.tsx`，与 ConfirmDialog 同级。

### StaffCreateDialog primary location invariant 客户端化

- 当前 zod refine 只校验 "primary 数量 <= 1"，没校验"添加 location 时必须有恰好一个 primary"；后端校验，但 UI 体验差（提交才报错）。
- 加：`addRow` / `removeRow` 时自动维护 invariant —— 第一行强制 `is_primary=true`；删除 primary 时把剩下第一行升级 primary（location editor 已有此逻辑，Dialog 没复制过来）。
- 顺手在 RHF 层面把 `useFieldArray` row 的 `is_primary` toggle 改成 radio group 语义（点一行其他自动取消）。

### scope-aware location 校验提早到 Dialog

- StaffCreateDialog 里"data_scope=assigned_locations 但 location_id=null"目前要等 submit 才报错；StaffRoleAssignmentEditor 详情页里已经做了 inline 提示。
- 把 RoleAssignmentEditor 里的 `validateRow` 抽公共，Dialog 内的 role/location 配置同一份校验，统一提示文案。

### Chip 输入控件抽出

- 当前 InstructorProfileSection 用 csv textarea 是 v1 妥协方案。当 Batch 6 出现 course tags / certificates v2 / brand keywords 等第 2 个数组短文本字段时，**才**开抽 `<ChipInput value={string[]} onChange separators={[',','；',Enter]} />`。
- 位置：`apps/brand/components/common/chip-input.tsx`；InstructorProfileSection 与 course tags 同步迁移。
- 不要提前抽：单一调用方场景 textarea 体验够、维护成本低。

### Batch 6 → Batch 7 延后项

- **角色管理页（自定义角色 CRUD UI）**：Batch 6 前端只做了权限消费侧（usePermissions hook + 菜单隐藏 + 按钮 disabled + toast）。品牌后台"角色管理"列表 + 角色编辑器（勾选 permission code、设 data_scope）依赖后端 GET /roles + GET /permissions，留 Batch 7。
- **T10 端到端回归 Playwright**：Batch 6 加了 data-testid 钩子但未自动跑。建议补关键路径：无 staff.create 权限时"新增员工"按钮 disabled + Hint tooltip 文案、菜单按权限隐藏、登出→换号登录后菜单立即刷新（防缓存泄漏回归，对应 commit 69f513c）。

## 2026-06-12 Batch 7 code-review 转移项

Batch 7（自定义角色 UI）post-impl code-review。1 项已当批修掉（commit `d207688`：角色停用/启用对 ROLE_NOT_FOUND 的处理对齐 confirmDelete）。以下转后续：

- ~~**B1 编辑既有角色被"全集校验"卡死**~~ ✅ **已解决**（2026-06-12，用户选 option B，backend commit `e17cdd0`：UpdateRole 改增量校验，只对新增权限做 ⊆ actor 校验，保留/移除既有权限放行，新增越权仍拒）。原始记录：后端 `guardPermissionSubset` 曾对**每次** update 校验提交的**全部** permission_codes ⊆ actor 有效权限（owner 例外）；前端 `role-editor-dialog.tsx` 刻意把"已勾但 actor 无权授予"的权限保留为可见可移除并在保存时回传。后果：非 owner 且持 `role.manage` 的 actor，编辑一个含其自身缺失权限（如 location.delete）的自定义角色时，即便只改名也被 `ROLE_PERMISSION_EXCEEDS_ACTOR` 拒绝，且 toast「请取消多余项」无对应高亮项，用户无从下手。可达性二阶（默认 brand_admin 多为全权不触发；需有人造出"带 role.manage 但缺某权限"的受限自定义角色）。建议（待用户确认）：后端 update 只对**新增**的 code（不在角色现有集合中的）做 subset 校验，保留/移除既有权限不校验——既守住"不能授予自己没有的权限"的提权防线，又解开编辑死结。create 仍全集校验（全是新增）。需要 `requireMutableCustomRole`/`UpdateRole` 先取角色现有权限码做 diff。
- **lint 覆盖缺 react-hooks / next core-web-vitals（仓库级 tooling）**：Batch 7 把 brand 的 lint 从 `next lint` 换为 `eslint .` 并新增 `apps/brand/eslint.config.mjs`（镜像 admin 现有 flat config），但该 flat config 未注册 `eslint-plugin-react-hooks`（rules-of-hooks / exhaustive-deps）与 `next/core-web-vitals`——admin 早已是同样情况，故属仓库既有约定而非本批回退。本批新 role-editor 的两个 useEffect 依赖数组已人工核对正确。建议：给 admin + brand 两个 flat config 补 `eslint-plugin-react-hooks`（依赖已在 node_modules），统一恢复 hooks 规则覆盖；`packages/config/eslint.js` 里的 `next/core-web-vitals` 当前未被 flat config 引用，一并梳理。

## 2026-06-12 Batch 7 验收期新增

- **`location.view` 无前端可见门 + `/locations` 管理页未建（Batch 4 FR 4.2 遗留）**：当前 `NAV_HREF_PERMISSIONS` 只有 `/staff`=staff.view、`/roles`=role.manage，`location.view` 不驱动任何菜单/按钮。契约 Happy #7/#8 描述的"location 入口随权限消失"在前端无体现（C1 主动失效已在 API+Redis 层证实，底层无问题）。建议：实现 `apps/brand/app/(protected)/locations/page.tsx`（门店 CRUD + 状态切换，复用 staff 页表格/弹窗模式）时，一并在 `NAV_HREF_PERMISSIONS` 加 `/locations`=location.view，让 location.view 有可见落点。
- **zustand persist 水合竞态致硬 URL 直达 `/roles` 瞬时跳 `/dashboard`**（既有问题，非 Batch 7）：persist 未水合时瞬时判未登录 → 跳转。点侧栏软导航正常。建议在 protected layout 的鉴权判断里等 persist `hasHydrated` 再决策，避免直达深链被踢。

## 2026-06-12 Batch 8 验收期新增

- **app/admin 两端 protected layout 水合竞态**：Batch 8 只给 brand 加了 `useAuthHydrated()` 门控；`apps/app` 和 `apps/admin` 的 protected layout 若有同样的 hard-load 守卫，也会把已登录用户瞬时弹走。建议同样接 `useAuthHydrated()`（已在 `@mini-schedule/api/auth` 导出，可直接复用）。
- **门店删除引用保护（LOCATION_IN_USE）**：后端现状直接软删无检查。门店被员工任职（brand_user_location_assignments）或未来课程场次引用时，应类似 Batch 7 A4 拒删并提示。等场次表落地后一并做。
- **UpdateStatus 改 gate location.toggle_status**：现 location.edit；migration seed 的专用 `location.toggle_status` 一直闲置。改时前端 LocationStatusToggle 也要从 LOCATION_EDIT 换到新常量。注意自定义角色若只给 edit 未给 toggle_status 会失去切换能力（行为变化）。
- **后端 location list 加 name 搜索**：现仅 status 筛选 + 分页（前端管理页无搜索框）。门店多时需要 `q` 模糊搜索（参考 staff list 的 q 参数）。
- **e2e 补「店长权限门」用例**：断言 location_manager（13900139001，仅 location.view 无 create/edit/delete）在 /locations 上新建/编辑/删除按钮全 disabled + Hint。

## 2026-06-16 Batch 11 验收期新增

- 排课弹窗课程下拉目前列全部已发布课程，未按所选门店的可用门店过滤（靠后端 COURSE_LOCATION_UNAVAILABLE 兜底 + inline 报错）；可选优化：选门店后只列该门店可用课程。
- instructor 下拉空态兜底文案（见 ERRORS）。
- 课程分类无删除入口（后端无 DELETE，只停用）；若后端补 DELETE 再加前端删除 + CATEGORY_IN_USE 处理。
- /schedule 取消场次未带原因输入（后端 cancel_reason 可选，前端走 ConfirmDialog 直接取消）；需要时加原因 textarea。
- /schedule 缺日期范围筛选（后端已支持 from/to），当前仅门店+状态筛选。

## 2026-06-16 Batch 12a 转移项

- Batch 12b 循环排课前端：/schedule 加「循环排课」入口（grill 定 tabs 单场次/循环排课）+ recurring-create-dialog（周几多选+起止+时长+容量+可选资源）+ 生成结果展示（成功 N / 跳过 M + 冲突清单）+ recurring 列表/详情/非级联 cancel。
- 排课/编辑场次时「所选资源已停用」提示（blueprint §20.5）。
- 资源占用日历视图。

## 2026-06-17 Batch 12b 转移项

- 学员预约批次前端（Booking）。
- 循环排课详情切换不同 id 时的 loading 态可更精细（当前 react-query 缓存命中即时显示）。
- /schedule 单场次表标记「来自循环排课」（需后端 list DTO 暴露 recurring_schedule_id）。

## 2026-06-22 Batch 13c
- `useBrandClassSessions` 加 `enabled` 参数（代预约弹窗关闭态不必拉场次）。
- 预约详情抽屉/页（已备 useBrandBooking/getBooking，含绑定权益+hold+来源+取消）。
- 代预约弹窗满员场次置灰/标记（当前显示 booked/capacity 但不禁选，靠后端 SESSION_FULL 兜）。
- /bookings 按学员/场次/门店筛选器（后端 list 已支持，前端仅暴露了状态+待补权益）。

## 2026-06-22 Batch 13d
- 候补 drawer 支持从 /bookings 也能打开（当前仅 /schedule 场次行入口）。
- 满员场次代预约下拉受 page_size=100 限制（既有），大量场次时需搜索/虚拟列表。
- 候补转正成功后 toast 带「已为 X 创建预约」更具体反馈。

## 2026-06-24 Batch 13e
- 占位预约签到文案：落库正确（无消费、保留 fix），但 entitlement 列显「无权益·占位」、成功 toast 同普通到课，弱于契约建议「无权益·已记异常·待补」。建议占位签到走差异化 toast/标签。
- 签到名单 page_size=100 上限（>100 人场次需分页/虚拟列表，同 13c/13d 既有）。
- 场次行 attended/no_show 计数徽标（当前仅 drawer 内派生，列表行无）。
