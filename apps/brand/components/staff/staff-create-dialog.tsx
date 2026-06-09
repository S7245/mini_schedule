'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface StaffCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * Placeholder shipped with F02 so the list page renders.
 * Full RHF + Zod form lands in F03 immediately after this commit.
 */
export function StaffCreateDialog({
  open,
  onOpenChange,
}: StaffCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新增员工</DialogTitle>
          <DialogDescription>新增员工表单 — F03 即将上线。</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
