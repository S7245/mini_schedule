'use client'

import type { Staff } from '@mini-schedule/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface StaffLocationAssignmentEditorProps {
  staff: Staff
}

/**
 * Placeholder — full editor lands in F05.
 */
export function StaffLocationAssignmentEditor({
  staff,
}: StaffLocationAssignmentEditorProps) {
  return (
    <Card data-testid="staff-location-editor">
      <CardHeader>
        <CardTitle className="text-base">门店任职</CardTitle>
      </CardHeader>
      <CardContent>
        {staff.location_assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">未配置门店任职</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {staff.location_assignments.map((a, i) => (
              <li
                key={`${a.location_id}-${i}`}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="font-medium">
                  {a.location_name ?? `门店 #${a.location_id}`}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {a.assignment_type}
                </span>
                {a.is_primary ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                    主门店
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
