'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface HintProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'content'> {
  /**
   * Tooltip text shown on hover/focus. When falsy, children render without a
   * wrapper so the common `disabled ? reason : undefined` pattern just works:
   *
   *   <Hint content={canCreate ? undefined : '权限不足，请联系管理员'}>
   *     <Button disabled={!canCreate}>新增员工</Button>
   *   </Hint>
   */
  content?: string | null | false
  /** Delay in ms before the tooltip opens on hover. Default 200. */
  delayDuration?: number
}

/**
 * Tooltip wrapper used to explain *why* a control is disabled.
 *
 * Backed by Radix (`@radix-ui/react-tooltip`) — styled, accessible
 * (`aria-describedby`), and keyboard-focusable, unlike a native `title`.
 *
 * Why the <span> wrapper + `[&_:disabled]:pointer-events-none`: a disabled
 * element doesn't dispatch pointer events, and shadcn's Button adds
 * `disabled:pointer-events-none` on top, so Radix's hover listeners would
 * never fire if attached to the button itself. Attaching the trigger to a
 * non-disabled span (and forcing any disabled descendant to
 * `pointer-events: none`) makes the hover land on the trigger so the tooltip
 * shows. Works for both shadcn Buttons and plain <button> link-style controls.
 */
export function Hint({
  content,
  className,
  children,
  delayDuration = 200,
  ...props
}: HintProps) {
  if (!content) return <>{children}</>

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex [&_:disabled]:pointer-events-none',
              className,
            )}
            {...props}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
