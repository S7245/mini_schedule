'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, ShieldCheck } from 'lucide-react'
import {
  useBrandRoles,
  useDeleteRole,
  usePatchRoleStatus,
} from '@mini-schedule/api/roles'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type { BrandRole } from '@mini-schedule/types'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  RoleEditorDialog,
  type RoleEditorMode,
} from '@/components/roles/role-editor-dialog'
import { RoleViewDialog } from '@/components/roles/role-view-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const PERMISSION_DENIED_TOOLTIP = '权限不足，请联系管理员'

const STATUS_LABELS: Record<string, string> = {
  active: '启用',
  inactive: '停用',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-700',
}

interface EditorState {
  mode: RoleEditorMode
  code?: string | null
  sourceRole?: BrandRole | null
}

export default function RolesPage() {
  const { has } = usePermissions()
  const canManage = has(PERMISSIONS.ROLE_MANAGE)

  const rolesQuery = useBrandRoles()
  const patchStatus = usePatchRoleStatus()
  const deleteRole = useDeleteRole()

  const [editor, setEditor] = useState<EditorState | null>(null)
  const [viewRole, setViewRole] = useState<BrandRole | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BrandRole | null>(null)
  const [statusTarget, setStatusTarget] = useState<BrandRole | null>(null)

  const roles = rolesQuery.data ?? []

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteRole.mutateAsync(deleteTarget.code)
      toast.success('角色已删除')
      setDeleteTarget(null)
    } catch (e) {
      if (e instanceof ApiErrorClass) {
        switch (e.code) {
          case ErrorCodes.ROLE_IN_USE:
            toast.error('该角色仍有员工任职，请先在员工详情移除任职')
            break
          case ErrorCodes.ROLE_IS_SYSTEM:
            toast.error('系统角色不可删除')
            break
          case ErrorCodes.OWNER_PROTECTED:
            toast.error('品牌负责人角色受系统保护，不可删除')
            break
          case ErrorCodes.ROLE_NOT_FOUND:
            toast.error('角色不存在或已被删除')
            break
          default:
            toast.error(e.message || '删除失败，请重试')
        }
      } else {
        toast.error('删除失败，请重试')
      }
      // Keep the dialog open on failure so the user sees context; close only on
      // a "gone" error where retry is pointless.
      if (e instanceof ApiErrorClass && e.code === ErrorCodes.ROLE_NOT_FOUND) {
        setDeleteTarget(null)
      }
    }
  }

  async function confirmToggleStatus() {
    if (!statusTarget) return
    const next = statusTarget.status === 'active' ? 'inactive' : 'active'
    try {
      await patchStatus.mutateAsync({ code: statusTarget.code, status: next })
      toast.success(next === 'inactive' ? '角色已停用' : '角色已启用')
      setStatusTarget(null)
    } catch (e) {
      if (e instanceof ApiErrorClass) {
        switch (e.code) {
          case ErrorCodes.ROLE_IS_SYSTEM:
            toast.error('系统角色不可停用/启用')
            break
          case ErrorCodes.OWNER_PROTECTED:
            toast.error('品牌负责人角色受系统保护')
            break
          case ErrorCodes.ROLE_NOT_FOUND:
            toast.error('角色不存在或已被删除')
            break
          default:
            toast.error(e.message || '操作失败，请重试')
        }
      } else {
        toast.error('操作失败，请重试')
      }
      // 角色已被他处删除时重试无意义，关闭弹窗（与 confirmDelete 一致）。
      if (e instanceof ApiErrorClass && e.code === ErrorCodes.ROLE_NOT_FOUND) {
        setStatusTarget(null)
      }
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">角色管理</h1>
          <p className="text-sm text-muted-foreground">
            管理品牌的系统角色与自定义角色。系统角色只读，可复制为自定义角色后调整权限。
          </p>
        </div>
        <Hint content={canManage ? undefined : PERMISSION_DENIED_TOOLTIP}>
          <Button
            onClick={() => setEditor({ mode: 'create' })}
            disabled={!canManage}
            data-testid="role-create-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            新建角色
          </Button>
        </Hint>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {rolesQuery.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            加载中...
          </p>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">暂无角色</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色名称</TableHead>
                <TableHead>范围</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>权限数</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.code} data-testid={`role-row-${role.code}`}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {role.scope_type === 'brand' ? '品牌级' : '门店级'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {role.is_system ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        系统
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                        自定义
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[role.status] ?? ''
                      }`}
                    >
                      {STATUS_LABELS[role.status] ?? role.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.permissions.length}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      {role.is_system ? (
                        <>
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => setViewRole(role)}
                            data-testid={`role-view-${role.code}`}
                          >
                            查看
                          </button>
                          <Hint
                            content={
                              canManage ? undefined : PERMISSION_DENIED_TOOLTIP
                            }
                          >
                            <button
                              type="button"
                              className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                              disabled={!canManage}
                              onClick={() =>
                                setEditor({ mode: 'copy', sourceRole: role })
                              }
                              data-testid={`role-copy-${role.code}`}
                            >
                              复制为自定义
                            </button>
                          </Hint>
                        </>
                      ) : (
                        <>
                          <Hint
                            content={
                              canManage ? undefined : PERMISSION_DENIED_TOOLTIP
                            }
                          >
                            <button
                              type="button"
                              className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                              disabled={!canManage}
                              onClick={() =>
                                setEditor({ mode: 'edit', code: role.code })
                              }
                              data-testid={`role-edit-${role.code}`}
                            >
                              编辑
                            </button>
                          </Hint>
                          <Hint
                            content={
                              canManage ? undefined : PERMISSION_DENIED_TOOLTIP
                            }
                          >
                            <button
                              type="button"
                              className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                              disabled={!canManage}
                              onClick={() => setStatusTarget(role)}
                              data-testid={`role-status-${role.code}`}
                            >
                              {role.status === 'active' ? '停用' : '启用'}
                            </button>
                          </Hint>
                          <Hint
                            content={
                              canManage ? undefined : PERMISSION_DENIED_TOOLTIP
                            }
                          >
                            <button
                              type="button"
                              className="text-destructive hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                              disabled={!canManage}
                              onClick={() => setDeleteTarget(role)}
                              data-testid={`role-delete-${role.code}`}
                            >
                              删除
                            </button>
                          </Hint>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {editor ? (
        <RoleEditorDialog
          open={!!editor}
          onOpenChange={(o) => {
            if (!o) setEditor(null)
          }}
          mode={editor.mode}
          code={editor.code}
          sourceRole={editor.sourceRole}
        />
      ) : null}

      <RoleViewDialog
        open={!!viewRole}
        onOpenChange={(o) => {
          if (!o) setViewRole(null)
        }}
        role={viewRole}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除角色"
        description={
          deleteTarget
            ? `确定删除角色「${deleteTarget.name}」？该操作不可撤销。`
            : undefined
        }
        confirmText="删除"
        destructive
        loading={deleteRole.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget?.status === 'active' ? '停用角色' : '启用角色'}
        description={
          statusTarget
            ? statusTarget.status === 'active'
              ? `停用「${statusTarget.name}」后将不可再分配给员工，已有任职不受影响。`
              : `启用「${statusTarget.name}」后可重新分配给员工。`
            : undefined
        }
        confirmText={statusTarget?.status === 'active' ? '停用' : '启用'}
        loading={patchStatus.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmToggleStatus}
      />
    </div>
  )
}
