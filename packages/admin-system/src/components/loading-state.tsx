export function LoadingState({ title = '加载中...' }: { title?: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center p-8">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
    </div>
  )
}
