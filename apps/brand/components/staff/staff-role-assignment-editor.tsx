'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { useReplaceStaffRoleAssignments } from '@mini-schedule/api/staff'
import { useBrandRoles } from '@mini-schedule/api/roles'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  CreateRoleAssignmentInput,
  DataScope,
  Staff,
} from '@mini-schedule/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DATA_SCOPES: Array<{ value: DataScope; label: string }> = [
  { value: 'role_default', label: '随角色（默认）' },
  { value: 'assigned_locations', label: '仅本人任职门店' },
]

interface RowState {
  // Local UI key so adding rows before save doesn't reuse stable ids
  uid: string
  role_code: string
  location_id: number | null
  data_scope: DataScope
}

function rowsFromStaff(staff: Staff): RowState[] {
  // 同 location editor 的兜底逻辑：?? [] 防 owner 等场景缺字段时整页崩。
  return (staff.role_assignments ?? []).map((r, i) => ({
    uid: `existing-${r.id ?? i}`,
    role_code: r.role_code,
    location_id: r.location_id,
    data_scope:
      r.data_scope === 'role_default' ||
      r.data_scope === 'assigned_locations'
        ? r.data_scope
        : 'role_default',
  }))
}

export interface StaffRoleAssignmentEditorProps {
  staff: Staff
}

export function StaffRoleAssignmentEditor({
  staff,
}: StaffRoleAssignmentEditorProps) {
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState<RowState[]>(() => rowsFromStaff(staff))
  const rolesQuery = useBrandRoles(editing)
  const locationsQuery = useBrandLocations(1, 100, 'active')
  const mutation = useReplaceStaffRoleAssignments()
  const { has } = usePermissions()
  const canAssignRole = has(PERMISSIONS.STAFF_ASSIGN_ROLE)

  // When the staff prop updates externally (after a successful PUT, after a
  // delete, etc.), re-hydrate the editor unless the user is mid-edit.
  useEffect(() => {
    if (!editing) setRows(rowsFromStaff(staff))
  }, [staff, editing])

  const assignableRoles = useMemo(
    () =>
      (rolesQuery.data ?? []).filter(
        (r) => r.code !== 'brand_owner' && r.status === 'active',
      ),
    [rolesQuery.data],
  )
  const locations = locationsQuery.data?.items ?? []

  function addRow() {
    const firstRole = assignableRoles[0]
    setRows((prev) => [
      ...prev,
      {
        uid: `new-${Date.now()}-${prev.length}`,
        role_code: firstRole?.code ?? '',
        location_id: null,
        data_scope: 'role_default',
      },
    ])
  }

  function removeRow(uid: string) {
    setRows((prev) => prev.filter((r) => r.uid !== uid))
  }

  function updateRow(uid: string, patch: Partial<RowState>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.uid !== uid) return r
        const next = { ...r, ...patch }
        // If the role flipped scope_type, reset location to keep state consistent
        if (patch.role_code) {
          const meta = assignableRoles.find((x) => x.code === patch.role_code)
          if (meta?.scope_type === 'brand') next.location_id = null
        }
        return next
      }),
    )
  }

  function cancel() {
    setRows(rowsFromStaff(staff))
    setEditing(false)
  }

  function validate(): string | null {
    for (const row of rows) {
      if (!row.role_code) return '请选择角色'
      const meta = assignableRoles.find((r) => r.code === row.role_code)
      if (!meta) return '所选角色无效'
      if (meta.scope_type === 'location' && !row.location_id) {
        return `角色「${meta.name}」需要选择门店`
      }
      if (meta.scope_type === 'brand' && row.location_id != null) {
        return `角色「${meta.name}」不能绑定门店`
      }
    }
    return null
  }

  async function save() {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    const payload: CreateRoleAssignmentInput[] = rows.map((r) => ({
      role_code: r.role_code,
      location_id: r.location_id,
      data_scope: r.data_scope,
    }))
    try {
      await mutation.mutateAsync({
        id: staff.id,
        data: { assignments: payload },
      })
      toast.success('角色任职已更新')
      setEditing(false)
    } catch (e) {
      if (e instanceof ApiErrorClass) {
        switch (e.code) {
          case ErrorCodes.ROLE_NOT_FOUND:
            toast.error('包含不存在的角色，请刷新后重试')
            return
          case ErrorCodes.INVALID_PARAM:
            toast.error(e.message || '角色配置不合法')
            return
          case ErrorCodes.OWNER_PROTECTED:
            // review B3：服务端拦下 owner 的角色变更（service.ReplaceRoleAssignments 已加守卫）
            toast.error('品牌负责人的角色由系统维护，不可手动修改')
            setEditing(false)
            return
          default:
            toast.error(e.message || '保存失败')
            return
        }
      }
      toast.error('保存失败')
    }
  }

  return (
    <Card data-testid="staff-role-editor">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">角色任职</CardTitle>
        {/* review B3：owner 的角色由系统维护，UI 不暴露编辑入口（服务端会以 OWNER_PROTECTED 兜底） */}
        {!editing && !staff.is_owner ? (
          <Hint content={canAssignRole ? undefined : PERMISSION_DENIED_TOOLTIP}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              disabled={!canAssignRole}
              data-testid="staff-role-edit"
            >
              编辑
            </Button>
          </Hint>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {!editing ? (
          (staff.role_assignments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">未分配角色</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {(staff.role_assignments ?? []).map((r, i) => (
                <li
                  key={`${r.role_id}-${r.location_id ?? 'brand'}-${i}`}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{r.role_name}</span>
                      {r.location_name ? (
                        <span className="ml-2 text-muted-foreground">
                          @{r.location_name}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {r.data_scope === 'role_default'
                        ? '随角色'
                        : r.data_scope === 'assigned_locations'
                          ? '仅任职门店'
                          : r.data_scope}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                未配置角色 — 保存即清空员工角色
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((row) => {
                  const meta = assignableRoles.find(
                    (r) => r.code === row.role_code,
                  )
                  const needsLocation = meta?.scope_type === 'location'
                  return (
                    <div
                      key={row.uid}
                      className="grid grid-cols-12 gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
                      data-testid="staff-role-row"
                    >
                      <div className="col-span-4">
                        <Select
                          value={row.role_code}
                          onValueChange={(v) =>
                            updateRow(row.uid, { role_code: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                          <SelectContent>
                            {assignableRoles.map((r) => (
                              <SelectItem key={r.code} value={r.code}>
                                {r.name}
                                <span className="ml-1 text-[10px] opacity-60">
                                  {r.scope_type === 'brand' ? '品牌' : '门店'}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        {needsLocation ? (
                          <Select
                            value={
                              row.location_id ? String(row.location_id) : ''
                            }
                            onValueChange={(v) =>
                              updateRow(row.uid, { location_id: Number(v) })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择门店" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((loc) => (
                                <SelectItem
                                  key={loc.id}
                                  value={String(loc.id)}
                                >
                                  {loc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="block px-2 py-1 text-xs text-muted-foreground">
                            品牌级角色无需门店
                          </span>
                        )}
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={row.data_scope}
                          onValueChange={(v) =>
                            updateRow(row.uid, { data_scope: v as DataScope })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_SCOPES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => removeRow(row.uid)}
                          aria-label="删除角色行"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addRow}
                disabled={assignableRoles.length === 0}
                data-testid="staff-role-add"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                添加角色
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={cancel}
                  disabled={mutation.isPending}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={save}
                  disabled={mutation.isPending}
                  data-testid="staff-role-save"
                >
                  {mutation.isPending ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
