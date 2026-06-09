'use client'

import type { Staff } from '@mini-schedule/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface InstructorProfileSectionProps {
  staff: Staff
}

/**
 * Placeholder — full editor lands in F06.
 */
export function InstructorProfileSection({ staff }: InstructorProfileSectionProps) {
  const profile = staff.instructor_profile
  return (
    <Card data-testid="staff-instructor-section">
      <CardHeader>
        <CardTitle className="text-base">教练档案</CardTitle>
      </CardHeader>
      <CardContent>
        {profile ? (
          <div className="text-sm">
            <p className="font-medium">{profile.display_name}</p>
            <p className="text-xs text-muted-foreground">
              状态：{profile.status}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            该员工尚未启用为教练。完整编辑功能将在 F06 上线。
          </p>
        )}
      </CardContent>
    </Card>
  )
}
