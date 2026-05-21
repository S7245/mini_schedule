import type { ReactNode } from 'react'

export function LoginShell({
  title,
  description,
  aside,
  children
}: {
  title: string
  description: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.1fr,0.9fr]">
      <section className="hidden border-r border-slate-200 bg-white px-12 py-16 lg:block">
        <div className="max-w-xl space-y-6">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Mini Schedule Backoffice
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="text-base leading-7 text-slate-600">{description}</p>
          </div>
          {aside}
        </div>
      </section>
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  )
}
