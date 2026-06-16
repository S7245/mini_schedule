'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useGenerateRecurringSchedule } from '@mini-schedule/api/recurring-schedules'
import { useBrandCourses } from '@mini-schedule/api/courses'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { useBrandLocationResources } from '@mini-schedule/api/location-resources'
import { useSchedulableInstructors } from '@mini-schedule/api/instructor'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
import type {
  GenerateRecurringScheduleResult,
  RecurringSkippedOccurrence,
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

// 周一优先展示，value = time.Weekday（0=周日）。
const WEEKDAY_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
]

const REASON_LABELS: Record<string, string> = {
  instructor_conflict: '教练时段冲突',
  resource_conflict: '资源时段冲突',
}

export interface RecurringCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RecurringCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: RecurringCreateDialogProps) {
  const generateMutation = useGenerateRecurringSchedule()
  const locationsQuery = useBrandLocations(1, 100, 'active')
  const coursesQuery = useBrandCourses({ status: 'published', page_size: 100 })
  const instructorsQuery = useSchedulableInstructors(open)

  const [locationId, setLocationId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [startDate, setStartDate] = useState('')
  const [endMode, setEndMode] = useState<'weeks' | 'date'>('weeks')
  const [repeatWeeks, setRepeatWeeks] = useState(4)
  const [endDate, setEndDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [capacity, setCapacity] = useState(8)
  const [apiError, setApiError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateRecurringScheduleResult | null>(
    null,
  )
  const [conflictSkipped, setConflictSkipped] = useState<
    RecurringSkippedOccurrence[] | null
  >(null)

  const resourcesQuery = useBrandLocationResources(
    { location_id: Number(locationId) || 0, status: 'active', page_size: 100 },
    open && Boolean(locationId),
  )

  const locations = locationsQuery.data?.items ?? []
  const courses = coursesQuery.data?.items ?? []
  const instructors = instructorsQuery.data?.items ?? []
  const resources = resourcesQuery.data?.items ?? []

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === courseId),
    [courses, courseId],
  )
  const selectedResource = useMemo(
    () => resources.find((r) => String(r.id) === resourceId),
    [resources, resourceId],
  )

  useEffect(() => {
    if (!open) return
    setLocationId('')
    setCourseId('')
    setInstructorId('')
    setResourceId('')
    setWeekdays([])
    setStartDate('')
    setEndMode('weeks')
    setRepeatWeeks(4)
    setEndDate('')
    setTime('09:00')
    setDuration(60)
    setCapacity(8)
    setApiError(null)
    setResult(null)
    setConflictSkipped(null)
  }, [open])

  useEffect(() => {
    setResourceId('')
  }, [locationId])

  useEffect(() => {
    if (selectedCourse) {
      setDuration(selectedCourse.duration_min)
      setCapacity(selectedCourse.default_capacity)
    }
  }, [selectedCourse])

  useEffect(() => {
    if (selectedResource) {
      setCapacity(selectedResource.capacity)
    }
  }, [selectedResource])

  function toggleWeekday(v: number) {
    setWeekdays((prev) =>
      prev.includes(v) ? prev.filter((w) => w !== v) : [...prev, v],
    )
  }

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.RECURRING_ALL_CONFLICT:
          return '所选时段全部冲突，未生成任何场次'
        case ErrorCodes.COURSE_NOT_ACTIVE:
          return '所选课程未发布，请先发布课程'
        case ErrorCodes.COURSE_LOCATION_UNAVAILABLE:
          return '该课程在所选门店不可排课'
        case ErrorCodes.INSTRUCTOR_NOT_SCHEDULABLE:
          return '所选教练不可排课'
        case ErrorCodes.RESOURCE_NOT_AVAILABLE:
          return '所选资源已停用，请改选或不绑定'
        case ErrorCodes.SESSION_TIME_INVALID:
          return err.message || '排课参数不合法'
        default:
          return err.message || '生成失败，请重试'
      }
    }
    return '生成失败，请重试'
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)
    setConflictSkipped(null)
    if (!locationId || !courseId || !instructorId || !startDate || !time) {
      setApiError('请完整填写门店、课程、教练、开始日期和时间')
      return
    }
    if (weekdays.length === 0) {
      setApiError('请至少选择一个星期几')
      return
    }
    try {
      const res = await generateMutation.mutateAsync({
        course_id: Number(courseId),
        location_id: Number(locationId),
        instructor_profile_id: Number(instructorId),
        location_resource_id: resourceId ? Number(resourceId) : null,
        weekdays: [...weekdays].sort((a, b) => a - b),
        start_date: startDate,
        repeat_weeks: endMode === 'weeks' ? repeatWeeks : undefined,
        end_date: endMode === 'date' ? endDate : undefined,
        start_time: time,
        duration_min: duration,
        capacity,
      })
      setResult(res)
      toast.success(`已生成 ${res.created_count} 节，跳过 ${res.skipped_count} 节`)
      onSuccess?.()
    } catch (err) {
      const msg = mapApiError(err)
      toast.error(msg)
      setApiError(msg)
      // 全冲突时后端把跳过清单放在 error.data.skipped。
      if (
        err instanceof ApiErrorClass &&
        err.code === ErrorCodes.RECURRING_ALL_CONFLICT
      ) {
        const data = err.data as { skipped?: RecurringSkippedOccurrence[] } | null
        setConflictSkipped(data?.skipped ?? [])
      }
    }
  }

  const skippedToShow = result?.skipped ?? conflictSkipped ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {result ? (
          // 生成结果面板。
          <div data-testid="recurring-result">
            <DialogHeader>
              <DialogTitle>循环排课已生成</DialogTitle>
              <DialogDescription>
                成功生成 {result.created_count} 节，跳过 {result.skipped_count} 节。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {skippedToShow.length > 0 ? (
                <div
                  className="rounded-md border border-amber-200 bg-amber-50 p-3"
                  data-testid="recurring-skipped-list"
                >
                  <p className="mb-2 text-sm font-medium text-amber-800">
                    以下时段因冲突被跳过：
                  </p>
                  <ul className="space-y-1 text-sm text-amber-700">
                    {skippedToShow.map((s, i) => (
                      <li key={`${s.date}-${s.start_time}-${i}`}>
                        {s.date} {s.start_time} —{' '}
                        {REASON_LABELS[s.reason] ?? s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  全部时段均已成功排课，无冲突。
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                data-testid="recurring-done"
              >
                完成
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} data-testid="recurring-form">
            <DialogHeader>
              <DialogTitle>循环排课</DialogTitle>
              <DialogDescription>
                每周重复，按所选星期几在区间内批量生成场次。冲突场次自动跳过并列出。
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
              <div className="space-y-2">
                <Label htmlFor="rec-location">门店 *</Label>
                <select
                  id="rec-location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  data-testid="recurring-field-location"
                >
                  <option value="">请选择门店</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rec-course">课程（已发布）*</Label>
                <select
                  id="rec-course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  data-testid="recurring-field-course"
                >
                  <option value="">请选择课程</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rec-instructor">教练 *</Label>
                <select
                  id="rec-instructor"
                  value={instructorId}
                  onChange={(e) => setInstructorId(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  data-testid="recurring-field-instructor"
                >
                  <option value="">请选择教练</option>
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rec-resource">资源（可选）</Label>
                <select
                  id="rec-resource"
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  disabled={!locationId}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50 disabled:text-muted-foreground"
                  data-testid="recurring-field-resource"
                >
                  <option value="">不绑定资源</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}（容量 {r.capacity}）
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>星期几 *</Label>
                <div
                  className="flex flex-wrap gap-2"
                  data-testid="recurring-field-weekdays"
                >
                  {WEEKDAY_OPTIONS.map((w) => (
                    <label
                      key={w.value}
                      className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-sm ${
                        weekdays.includes(w.value)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={weekdays.includes(w.value)}
                        onChange={() => toggleWeekday(w.value)}
                        data-testid={`recurring-weekday-${w.value}`}
                      />
                      {w.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rec-start-date">开始日期 *</Label>
                  <Input
                    id="rec-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="recurring-field-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-time">开始时间 *</Label>
                  <Input
                    id="rec-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    data-testid="recurring-field-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>结束方式 *</Label>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="rec-end-mode"
                      checked={endMode === 'weeks'}
                      onChange={() => setEndMode('weeks')}
                      data-testid="recurring-endmode-weeks"
                    />
                    重复周数
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="rec-end-mode"
                      checked={endMode === 'date'}
                      onChange={() => setEndMode('date')}
                      data-testid="recurring-endmode-date"
                    />
                    结束日期
                  </label>
                </div>
                {endMode === 'weeks' ? (
                  <Input
                    type="number"
                    min={1}
                    max={26}
                    value={repeatWeeks}
                    onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                    data-testid="recurring-field-repeat-weeks"
                  />
                ) : (
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    data-testid="recurring-field-end-date"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rec-duration">时长（分钟）*</Label>
                  <Input
                    id="rec-duration"
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    data-testid="recurring-field-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-capacity">容量 *</Label>
                  <Input
                    id="rec-capacity"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    data-testid="recurring-field-capacity"
                  />
                </div>
              </div>

              {conflictSkipped && conflictSkipped.length > 0 ? (
                <div
                  className="rounded-md border border-amber-200 bg-amber-50 p-3"
                  data-testid="recurring-skipped-list"
                >
                  <p className="mb-2 text-sm font-medium text-amber-800">
                    全部时段冲突，未生成：
                  </p>
                  <ul className="space-y-1 text-sm text-amber-700">
                    {conflictSkipped.map((s, i) => (
                      <li key={`${s.date}-${s.start_time}-${i}`}>
                        {s.date} {s.start_time} —{' '}
                        {REASON_LABELS[s.reason] ?? s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {apiError ? (
                <p
                  data-testid="api-error"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {apiError}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={generateMutation.isPending}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={generateMutation.isPending}
                data-testid="recurring-submit"
              >
                {generateMutation.isPending ? '生成中...' : '生成场次'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
