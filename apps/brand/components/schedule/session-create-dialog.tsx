'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCreateClassSession } from '@mini-schedule/api/class-sessions'
import { useBrandCourses } from '@mini-schedule/api/courses'
import { useBrandLocations } from '@mini-schedule/api/locations'
import { useBrandLocationResources } from '@mini-schedule/api/location-resources'
import { useSchedulableInstructors } from '@mini-schedule/api/instructor'
import { ApiErrorClass, ErrorCodes } from '@mini-schedule/api/errors'
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

export interface SessionCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SessionCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: SessionCreateDialogProps) {
  const createMutation = useCreateClassSession()
  const locationsQuery = useBrandLocations(1, 100, 'active')
  const coursesQuery = useBrandCourses({ status: 'published', page_size: 100 })
  const instructorsQuery = useSchedulableInstructors(open)

  const [locationId, setLocationId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [capacity, setCapacity] = useState(8)
  const [apiError, setApiError] = useState<string | null>(null)

  // 资源按所选门店级联拉取（仅 active）。未选门店时不查询。
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
    setDate('')
    setTime('09:00')
    setDuration(60)
    setCapacity(8)
    setApiError(null)
  }, [open])

  // 切换门店时清空已选资源（资源属门店）。
  useEffect(() => {
    setResourceId('')
  }, [locationId])

  // When a course is picked, default duration/capacity from its template.
  useEffect(() => {
    if (selectedCourse) {
      setDuration(selectedCourse.duration_min)
      setCapacity(selectedCourse.default_capacity)
    }
  }, [selectedCourse])

  // 选中资源后，容量默认填资源容量（用户仍可改；后端最终以显式>资源>课程为序）。
  useEffect(() => {
    if (selectedResource) {
      setCapacity(selectedResource.capacity)
    }
  }, [selectedResource])

  function mapApiError(err: unknown): string {
    if (err instanceof ApiErrorClass) {
      switch (err.code) {
        case ErrorCodes.SESSION_INSTRUCTOR_CONFLICT:
          return '该教练在此时段已有排课，请调整时间或教练'
        case ErrorCodes.SESSION_RESOURCE_CONFLICT:
          return '该资源在此时段已被占用，请调整时间或资源'
        case ErrorCodes.RESOURCE_NOT_AVAILABLE:
          return '所选资源已停用，请改选其他资源或不绑定'
        case ErrorCodes.COURSE_LOCATION_UNAVAILABLE:
          return '该课程在所选门店不可排课，请到课程模板调整可用门店'
        case ErrorCodes.COURSE_NOT_ACTIVE:
          return '所选课程未发布，请先发布课程'
        case ErrorCodes.INSTRUCTOR_NOT_SCHEDULABLE:
          return '所选教练不可排课'
        case ErrorCodes.SESSION_TIME_INVALID:
          return '场次时间不合法，开始时间须晚于当前时间'
        default:
          return err.message || '排课失败，请重试'
      }
    }
    return '排课失败，请重试'
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)
    if (!locationId || !courseId || !instructorId || !date || !time) {
      setApiError('请完整填写门店、课程、教练和时间')
      return
    }
    const starts = new Date(`${date}T${time}`)
    if (Number.isNaN(starts.getTime())) {
      setApiError('开始时间格式不正确')
      return
    }
    const ends = new Date(starts.getTime() + duration * 60_000)
    try {
      await createMutation.mutateAsync({
        course_id: Number(courseId),
        location_id: Number(locationId),
        instructor_profile_id: Number(instructorId),
        location_resource_id: resourceId ? Number(resourceId) : null,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        capacity,
      })
      toast.success('场次已创建')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      const msg = mapApiError(err)
      toast.error(msg)
      setApiError(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} data-testid="session-form">
          <DialogHeader>
            <DialogTitle>排课 · 新增场次</DialogTitle>
            <DialogDescription>
              选择门店、已发布课程、可排课教练和时间，创建一节场次。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-location">门店 *</Label>
              <select
                id="session-location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                data-testid="session-field-location"
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
              <Label htmlFor="session-course">课程（已发布）*</Label>
              <select
                id="session-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                data-testid="session-field-course"
              >
                <option value="">请选择课程</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              {courses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  暂无已发布课程，请先到「课程模板」发布课程。
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-instructor">教练 *</Label>
              <select
                id="session-instructor"
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                data-testid="session-field-instructor"
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
              <Label htmlFor="session-resource">资源（可选）</Label>
              <select
                id="session-resource"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                disabled={!locationId}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50 disabled:text-muted-foreground"
                data-testid="session-field-resource"
              >
                <option value="">不绑定资源</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}（容量 {r.capacity}）
                  </option>
                ))}
              </select>
              {locationId && resources.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  该门店暂无启用资源，可在「资源管理」中添加。
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-date">日期 *</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-testid="session-field-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-time">开始时间 *</Label>
                <Input
                  id="session-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  data-testid="session-field-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-duration">时长（分钟）*</Label>
                <Input
                  id="session-duration"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  data-testid="session-field-duration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-capacity">容量 *</Label>
                <Input
                  id="session-capacity"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  data-testid="session-field-capacity"
                />
              </div>
            </div>

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
              disabled={createMutation.isPending}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="session-submit"
            >
              {createMutation.isPending ? '创建中...' : '排课'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
