'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppTrainings, useCreateTraining } from '@mini-schedule/api/app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { ProtectedLayout } from '@/components/layout/protected-layout'

const trainingSchema = z.object({
  course_id: z.coerce.number().min(1, '请输入课程 ID'),
  duration_min: z.coerce.number().min(1, '时长必须大于 0'),
  calories: z.coerce.number().optional(),
  notes: z.string().max(500, '备注最多 500 字').optional(),
})

type TrainingForm = z.infer<typeof trainingSchema>

export default function TrainingsPage() {
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading } = useAppTrainings(page, 20)
  const createMutation = useCreateTraining()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TrainingForm>({
    resolver: zodResolver(trainingSchema),
    defaultValues: { course_id: 0, duration_min: 30, calories: undefined, notes: '' },
  })

  const onSubmit = async (formData: TrainingForm) => {
    await createMutation.mutateAsync({
      ...formData,
      course_id: String(formData.course_id),
    })
    reset()
    setDialogOpen(false)
  }

  return (
    <ProtectedLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">训练记录</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm">+ 记录训练</Button></DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader><DialogTitle>记录训练</DialogTitle><DialogDescription>填写本次训练信息</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label htmlFor="course_id">课程 ID</Label><Input id="course_id" type="number" {...register('course_id')} />{errors.course_id && <p className="text-sm text-destructive">{errors.course_id.message}</p>}</div>
                  <div className="space-y-2"><Label htmlFor="duration_min">时长（分钟）</Label><Input id="duration_min" type="number" {...register('duration_min')} />{errors.duration_min && <p className="text-sm text-destructive">{errors.duration_min.message}</p>}</div>
                  <div className="space-y-2"><Label htmlFor="calories">消耗卡路里（选填）</Label><Input id="calories" type="number" step="0.1" {...register('calories')} /></div>
                  <div className="space-y-2"><Label htmlFor="notes">备注（选填）</Label><Textarea id="notes" rows={2} {...register('notes')} /></div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                  <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? '保存中...' : '保存'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? <p className="text-muted-foreground">加载中...</p> : !data?.items.length ? <p className="text-muted-foreground">暂无训练记录</p> : (
          <div className="grid gap-3">
            {data.items.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.duration_minutes} 分钟</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(t.trained_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      {t.calories_burned && <p className="text-sm font-medium">{t.calories_burned} 千卡</p>}
                      {t.course_id && <p className="text-xs text-muted-foreground">课程 #{t.course_id}</p>}
                    </div>
                  </div>
                  {t.notes && <p className="text-sm text-muted-foreground mt-2 truncate">{t.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data && data.total > data.page_size && (
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / data.page_size)} onClick={() => setPage((p) => p + 1)}>下一页</Button>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
