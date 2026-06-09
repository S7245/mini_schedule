'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { useReplaceStaffLocationAssignments } from '@mini-schedule/api/staff'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  CreateLocationAssignmentInput,
  LocationAssignmentType,
  Staff,
} from '@mini-schedule/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ASSIGNMENT_TYPES: Array<{
  value: LocationAssignmentType
  label: string
}> = [
  { value: 'member', label: '普通成员' },
  { value: 'manager', label: '店长' },
  { value: 'instructor', label: '教练' },
  { value: 'assistant', label: '协助' },
]

interface RowState {
  uid: string
  location_id: number
  assignment_type: LocationAssignmentType
  is_primary: boolean
}

function rowsFromStaff(staff: Staff): RowState[] {
  // 后端已 d0dd639+1 移除 omitempty，但保留 ?? [] 兜底，
  // 避免老版本 API / 缓存返回缺字段时整页崩溃。
  return (staff.location_assignments ?? []).map((a, i) => ({
    uid: `existing-${a.id ?? i}`,
    location_id: a.location_id,
    assignment_type: a.assignment_type,
    is_primary: a.is_primary,
  }))
}

export interface StaffLocationAssignmentEditorProps {
  staff: Staff
}

export function StaffLocationAssignmentEditor({
  staff,
}: StaffLocationAssignmentEditorProps) {
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState<RowState[]>(() => rowsFromStaff(staff))
  const locationsQuery = useBrandLocations(1, 100, 'active')
  const mutation = useReplaceStaffLocationAssignments()

  useEffect(() => {
    if (!editing) setRows(rowsFromStaff(staff))
  }, [staff, editing])

  const locations = locationsQuery.data?.items ?? []

  function addRow() {
    const firstLoc = locations[0]
    setRows((prev) => [
      ...prev,
      {
        uid: `new-${Date.now()}-${prev.length}`,
        location_id: firstLoc ? firstLoc.id : 0,
        assignment_type: 'member',
        is_primary: prev.length === 0,
      },
    ])
  }

  function removeRow(uid: string) {
    setRows((prev) => {
      const remaining = prev.filter((r) => r.uid !== uid)
      // If we removed the primary, promote the first remaining row.
      const hadPrimary = remaining.some((r) => r.is_primary)
      if (!hadPrimary && remaining.length > 0) {
        remaining[0] = { ...remaining[0], is_primary: true }
      }
      return remaining
    })
  }

  function updateRow(uid: string, patch: Partial<RowState>) {
    setRows((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)),
    )
  }

  function setPrimary(uid: string) {
    setRows((prev) =>
      prev.map((r) => ({ ...r, is_primary: r.uid === uid })),
    )
  }

  function cancel() {
    setRows(rowsFromStaff(staff))
    setEditing(false)
  }

  function validate(): string | null {
    if (rows.length === 0) return null
    const primaryCount = rows.filter((r) => r.is_primary).length
    if (primaryCount > 1) return '最多只能设置 1 个主门店'
    if (primaryCount === 0) return '请选择一个主门店'
    const ids = rows.map((r) => r.location_id)
    if (ids.some((id) => !id)) return '请为每行选择门店'
    const dedup = new Set(ids)
    if (dedup.size !== ids.length) return '同一门店不能重复任职'
    return null
  }

  async function save() {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    const payload: CreateLocationAssignmentInput[] = rows.map((r) => ({
      location_id: r.location_id,
      assignment_type: r.assignment_type,
      is_primary: r.is_primary,
    }))
    try {
      await mutation.mutateAsync({
        id: staff.id,
        data: { assignments: payload },
      })
      toast.success('门店任职已更新')
      setEditing(false)
    } catch (e) {
      if (e instanceof ApiErrorClass) {
        switch (e.code) {
          case ErrorCodes.LOCATION_ASSIGNMENT_INVALID:
            toast.error('包含不可用的门店任职，请刷新后重试')
            return
          case ErrorCodes.INVALID_PARAM:
            toast.error(e.message || '门店任职配置不合法')
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
    <Card data-testid="staff-location-editor">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">门店任职</CardTitle>
        {!editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            data-testid="staff-location-edit"
          >
            编辑
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {!editing ? (
          (staff.location_assignments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">未配置门店任职</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {(staff.location_assignments ?? []).map((a, i) => (
                <li
                  key={`${a.location_id}-${i}`}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {a.location_name ?? `门店 #${a.location_id}`}
                      </span>
                      {a.is_primary ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                          主门店
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {ASSIGNMENT_TYPES.find(
                        (t) => t.value === a.assignment_type,
                      )?.label ?? a.assignment_type}
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
                未配置门店任职 — 保存即清空员工门店任职
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((row) => (
                  <div
                    key={row.uid}
                    className="grid grid-cols-12 gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
                    data-testid="staff-location-row"
                  >
                    <div className="col-span-5">
                      <Select
                        value={row.location_id ? String(row.location_id) : ''}
                        onValueChange={(v) =>
                          updateRow(row.uid, { location_id: Number(v) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择门店" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={String(loc.id)}>
                              {loc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Select
                        value={row.assignment_type}
                        onValueChange={(v) =>
                          updateRow(row.uid, {
                            assignment_type: v as LocationAssignmentType,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNMENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <label className="flex items-center gap-1 text-xs text-slate-700">
                        <input
                          type="radio"
                          name={`staff-${staff.id}-primary-location`}
                          checked={row.is_primary}
                          onChange={() => setPrimary(row.uid)}
                        />
                        主门店
                      </label>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => removeRow(row.uid)}
                        aria-label="删除门店任职"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addRow}
                disabled={locations.length === 0}
                data-testid="staff-location-add"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                添加门店任职
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
                  data-testid="staff-location-save"
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
