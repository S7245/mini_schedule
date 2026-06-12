'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  useBrandRole,
  useCreateRole,
  usePermissionCatalog,
  useUpdateRole,
} from '@mini-schedule/api/roles'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  BrandRole,
  CreateRoleInput,
  RoleScopeType,
  UpdateRoleInput,
} from '@mini-schedule/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Hint } from '@/components/ui/hint'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePermissions } from '@/lib/permissions'

const NAME_MAX = 40

const SCOPE_LABELS: Record<RoleScopeType, string> = {
  brand: '品牌级',
  location: '门店级',
}

/**
 * How the dialog was opened:
 * - create: blank form, POST
 * - edit:   prefill from getBrandRole(code), PUT (scope locked, A3)
 * - copy:   prefill from a system role (name + 「副本」, same scope/perms), POST
 */
export type RoleEditorMode = 'create' | 'edit' | 'copy'

export interface RoleEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: RoleEditorMode
  /** Role code to load for `edit`; ignored otherwise. */
  code?: string | null
  /** Source role for `copy` mode (already in hand from the list). */
  sourceRole?: BrandRole | null
}

interface FormState {
  name: string
  scope_type: RoleScopeType
  description: string
  permission_codes: Set<string>
}

const EMPTY_FORM: FormState = {
  name: '',
  scope_type: 'brand',
  description: '',
  permission_codes: new Set<string>(),
}

const EXCEEDS_ACTOR_TOOLTIP = '超出你自身的权限，无法授予'

export function RoleEditorDialog({
  open,
  onOpenChange,
  mode,
  code,
  sourceRole,
}: RoleEditorDialogProps) {
  const isEdit = mode === 'edit'
  const catalogQuery = usePermissionCatalog(open)
  // Only fetch the single role in edit mode (copy uses the in-hand sourceRole).
  const roleQuery = useBrandRole(isEdit ? code ?? null : null, open && isEdit)
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const { has, dataScope } = usePermissions()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [apiError, setApiError] = useState<string | null>(null)

  // Owner (data_scope.kind === 'all_brand' with no location restriction) gets a
  // front-line fast-path: every permission is selectable. For non-owner actors
  // we gate the tree against their own effective permission set (B1; backend
  // still enforces). We approximate "owner" as all_brand scope — the safe side
  // here is "more disabled", and backend is the source of truth.
  const actorIsAllBrand = dataScope.kind === 'all_brand'

  // (Re)seed the form whenever the dialog opens or its source changes.
  useEffect(() => {
    if (!open) return
    setApiError(null)
    if (mode === 'create') {
      setForm({ ...EMPTY_FORM, permission_codes: new Set<string>() })
    } else if (mode === 'copy' && sourceRole) {
      setForm({
        name: `${sourceRole.name}副本`.slice(0, NAME_MAX),
        scope_type: sourceRole.scope_type,
        description: sourceRole.description ?? '',
        permission_codes: new Set(sourceRole.permissions.map((p) => p.code)),
      })
    }
    // edit mode is seeded by the roleQuery effect below
  }, [open, mode, sourceRole])

  // Seed from the freshly fetched role detail (edit mode).
  useEffect(() => {
    if (!open || !isEdit || !roleQuery.data) return
    const r = roleQuery.data
    setForm({
      name: r.name,
      scope_type: r.scope_type,
      description: r.description ?? '',
      permission_codes: new Set(r.permissions.map((p) => p.code)),
    })
  }, [open, isEdit, roleQuery.data])

  const catalog = catalogQuery.data ?? []

  function canGrant(permCode: string): boolean {
    if (actorIsAllBrand) return true
    return has(permCode)
  }

  function togglePermission(permCode: string) {
    setForm((prev) => {
      const next = new Set(prev.permission_codes)
      if (next.has(permCode)) next.delete(permCode)
      else next.add(permCode)
      return { ...prev, permission_codes: next }
    })
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): string | null {
    const name = form.name.trim()
    if (!name) return '请输入角色名称'
    if (name.length > NAME_MAX) return `角色名称最多 ${NAME_MAX} 个字符`
    return null
  }

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.ROLE_PERMISSION_EXCEEDS_ACTOR:
          return '所选权限超出你自身的有效权限，请取消多余项后重试'
        case ErrorCodes.ROLE_IS_SYSTEM:
          return '系统角色不可修改，请改用「复制为自定义」'
        case ErrorCodes.ROLE_CODE_DUPLICATED:
          return '角色编码冲突，请重试'
        case ErrorCodes.OWNER_PROTECTED:
          return '品牌负责人角色受系统保护，不可修改'
        case ErrorCodes.ROLE_NOT_FOUND:
          return '角色不存在或已被删除，请刷新后重试'
        case ErrorCodes.INVALID_PARAM:
          return err.message || '请求参数不合法'
        default:
          return err.message || '保存失败，请重试'
      }
    }
    return '保存失败，请重试'
  }

  const pending = createMutation.isPending || updateMutation.isPending

  async function handleSubmit() {
    const err = validate()
    if (err) {
      setApiError(err)
      toast.error(err)
      return
    }
    setApiError(null)

    // permission_codes is ALWAYS a real array (never omitted / null) — empty
    // array means a no-permission role, which is valid.
    const permission_codes = Array.from(form.permission_codes)

    try {
      if (isEdit) {
        const input: UpdateRoleInput = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          permission_codes,
        }
        await updateMutation.mutateAsync({ code: code as string, input })
        toast.success('角色已更新')
      } else {
        // create + copy both submit via POST
        const input: CreateRoleInput = {
          name: form.name.trim(),
          scope_type: form.scope_type,
          description: form.description.trim() || undefined,
          permission_codes,
        }
        await createMutation.mutateAsync(input)
        toast.success(mode === 'copy' ? '已复制为自定义角色' : '角色已创建')
      }
      onOpenChange(false)
    } catch (e) {
      const msg = mapApiError(e)
      setApiError(msg)
      toast.error(msg)
    }
  }

  const loadingDetail = isEdit && roleQuery.isLoading
  const title =
    mode === 'edit'
      ? '编辑角色'
      : mode === 'copy'
        ? '复制为自定义角色'
        : '新建角色'

  // scope_type is only editable on create. On edit it is locked (A3); on copy it
  // inherits the source role's scope and is also locked.
  const scopeLocked = mode !== 'create'

  const selectedCount = form.permission_codes.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              {mode === 'edit'
                ? '权限为全量替换：保存后角色权限以下方勾选为准。'
                : '勾选该角色应具备的权限，保存后可在员工详情中分配。'}
            </div>
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载角色详情...
          </p>
        ) : (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto py-2 pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role-name">角色名称 *</Label>
                <Input
                  id="role-name"
                  placeholder="例如：前台兼职"
                  maxLength={NAME_MAX}
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  data-testid="role-field-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-scope">权限范围 *</Label>
                {scopeLocked ? (
                  <div
                    className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
                    data-testid="role-field-scope-locked"
                  >
                    {SCOPE_LABELS[form.scope_type]}
                    <span className="ml-2 text-xs">（创建后不可更改）</span>
                  </div>
                ) : (
                  <Select
                    value={form.scope_type}
                    onValueChange={(v) =>
                      updateField('scope_type', v as RoleScopeType)
                    }
                  >
                    <SelectTrigger
                      id="role-scope"
                      data-testid="role-field-scope"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand">品牌级</SelectItem>
                      <SelectItem value="location">门店级</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-desc">描述</Label>
              <Textarea
                id="role-desc"
                placeholder="可选：说明该角色的职责"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                data-testid="role-field-description"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>权限 *</Label>
                <span className="text-xs text-muted-foreground">
                  已选 {selectedCount} 项
                </span>
              </div>
              {catalogQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">加载权限目录...</p>
              ) : catalog.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无可分配权限</p>
              ) : (
                <div
                  className="space-y-4 rounded-md border border-slate-200 p-3"
                  data-testid="role-permission-tree"
                >
                  {catalog.map((group) => (
                    <div key={group.domain} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.domain}
                      </p>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {group.permissions.map((perm) => {
                          const checked = form.permission_codes.has(perm.code)
                          const grantable = canGrant(perm.code)
                          // Keep an already-granted perm visible/removable even
                          // if the actor wouldn't be able to grant it fresh.
                          const disabled = !grantable && !checked
                          return (
                            <Hint
                              key={perm.code}
                              content={disabled ? EXCEEDS_ACTOR_TOOLTIP : undefined}
                            >
                              <label
                                className={
                                  disabled
                                    ? 'flex cursor-not-allowed items-start gap-2 rounded-md px-2 py-1.5 opacity-50'
                                    : 'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50'
                                }
                                data-testid={`role-perm-${perm.code}`}
                              >
                                <input
                                  type="checkbox"
                                  className="mt-0.5"
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => togglePermission(perm.code)}
                                />
                                <span className="text-sm">
                                  <span className="font-medium">{perm.name}</span>
                                  <span className="ml-1 text-[10px] text-muted-foreground">
                                    {perm.code}
                                  </span>
                                  {perm.description ? (
                                    <span className="block text-xs text-muted-foreground">
                                      {perm.description}
                                    </span>
                                  ) : null}
                                </span>
                              </label>
                            </Hint>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {apiError ? (
              <div
                data-testid="role-api-error"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {apiError}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={pending || loadingDetail}
            data-testid="role-submit"
          >
            {pending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
