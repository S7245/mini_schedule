'use client'

import type { BrandRole, RoleScopeType } from '@mini-schedule/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const SCOPE_LABELS: Record<RoleScopeType, string> = {
  brand: '品牌级',
  location: '门店级',
}

export interface RoleViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: BrandRole | null
}

/**
 * Read-only view of a (system) role — name, scope, and its permission set.
 * System roles are fully read-only (A1); editing happens via「复制为自定义」.
 */
export function RoleViewDialog({ open, onOpenChange, role }: RoleViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{role?.name ?? '角色详情'}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              {role
                ? `${SCOPE_LABELS[role.scope_type]} · ${
                    role.is_system ? '系统角色（只读）' : '自定义角色'
                  }`
                : null}
            </div>
          </DialogDescription>
        </DialogHeader>
        {role ? (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2 pr-1">
            {role.description ? (
              <p className="text-sm text-muted-foreground">{role.description}</p>
            ) : null}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                权限（{role.permissions.length} 项）
              </p>
              {role.permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">该角色无权限</p>
              ) : (
                <ul className="space-y-1.5">
                  {role.permissions.map((p) => (
                    <li
                      key={p.code}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        {p.code}
                      </span>
                      {p.description ? (
                        <span className="block text-xs text-muted-foreground">
                          {p.description}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
