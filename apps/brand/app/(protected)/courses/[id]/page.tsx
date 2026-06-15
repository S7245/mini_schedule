'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useBrandCourse } from '@mini-schedule/api/courses'
import { useBrandClassSessions } from '@mini-schedule/api/class-sessions'
import { useBrandLocations } from '@mini-schedule/api/locations'
import type { CourseStatus } from '@mini-schedule/types'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import { CourseFormDialog } from '@/components/courses/course-form-dialog'
import { PERMISSIONS, usePermissions } from '@/lib/permissions'

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

const STATUS_BADGE: Record<CourseStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-amber-100 text-amber-800',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function CourseDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const { has } = usePermissions()
  const canEdit = has(PERMISSIONS.COURSE_EDIT)
  const [editOpen, setEditOpen] = useState(false)

  const courseQuery = useBrandCourse(Number.isFinite(id) ? id : null)
  const locationsQuery = useBrandLocations(1, 100, 'all')
  const sessionsQuery = useBrandClassSessions({
    course_id: Number.isFinite(id) ? id : undefined,
    page_size: 10,
  })

  const course = courseQuery.data
  const locationNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const l of locationsQuery.data?.items ?? []) map.set(l.id, l.name)
    return map
  }, [locationsQuery.data])

  if (courseQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">加载中...</p>
  }
  if (!course) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">课程不存在或已被删除。</p>
        <Link href="/courses" className="text-primary hover:underline">
          返回课程列表
        </Link>
      </div>
    )
  }

  const sessions = sessionsQuery.data?.items ?? []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回课程列表
        </Link>
        <Hint content={canEdit ? undefined : '权限不足，请联系管理员'}>
          <Button
            variant="outline"
            disabled={!canEdit}
            onClick={() => setEditOpen(true)}
            data-testid="course-edit-button"
          >
            编辑
          </Button>
        </Hint>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            {course.title}
          </h1>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[course.status]}`}
          >
            {STATUS_LABELS[course.status]}
          </span>
        </div>
        {course.description ? (
          <p className="text-sm text-muted-foreground">{course.description}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-900">基本信息</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">级别</dt>
              <dd>{course.level_label || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">默认时长</dt>
              <dd>{course.duration_min} 分钟</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">默认容量</dt>
              <dd>{course.default_capacity} 人</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">小程序展示</dt>
              <dd>{course.show_in_mini_program ? '是' : '否'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-900">分类</h2>
          <div className="flex flex-wrap gap-1">
            {course.categories.length === 0 ? (
              <span className="text-sm text-muted-foreground">未绑定分类</span>
            ) : (
              course.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color ?? '#cbd5e1' }}
                  />
                  {cat.name}
                </span>
              ))
            )}
          </div>
          <h2 className="mb-2 mt-4 text-sm font-medium text-slate-900">
            可用门店
          </h2>
          <div className="flex flex-wrap gap-1">
            {course.available_location_ids.length === 0 ? (
              <span className="text-sm text-muted-foreground">未设置可用门店</span>
            ) : (
              course.available_location_ids.map((lid) => (
                <span
                  key={lid}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {locationNameById.get(lid) ?? `门店 #${lid}`}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-900">近期场次</h2>
          <Link href="/schedule" className="text-sm text-primary hover:underline">
            前往排课
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无场次</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm" data-testid="course-sessions">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span>
                  {formatTime(s.starts_at)} · {s.location_name} · {s.instructor_name}
                </span>
                <span className="text-muted-foreground">
                  {s.booked_count}/{s.capacity} · {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CourseFormDialog
        open={editOpen}
        initial={course}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}
