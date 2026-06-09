'use client'

import type { Staff } from '@mini-schedule/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface StaffRoleAssignmentEditorProps {
  staff: Staff
}

/**
 * Placeholder — full editor lands in F05.
 */
export function StaffRoleAssignmentEditor({
  staff,
}: StaffRoleAssignmentEditorProps) {
  return (
    <Card data-testid="staff-role-editor">
      <CardHeader>
        <CardTitle className="text-base">角色任职</CardTitle>
      </CardHeader>
      <CardContent>
        {staff.role_assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">未分配角色</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {staff.role_assignments.map((r, i) => (
              <li
                key={`${r.role_id}-${r.location_id ?? 'brand'}-${i}`}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="font-medium">{r.role_name}</span>
                {r.location_name ? (
                  <span className="ml-2 text-muted-foreground">
                    @{r.location_name}
                  </span>
                ) : null}
                <span className="ml-2 text-xs text-muted-foreground">
                  data_scope: {r.data_scope}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
