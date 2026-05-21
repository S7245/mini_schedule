const toneMap = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  neutral: 'bg-muted text-muted-foreground',
  danger: 'bg-red-100 text-red-800'
} as const

export function StatusBadge({
  label,
  tone
}: {
  label: string
  tone: keyof typeof toneMap
}) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${toneMap[tone]}`}>{label}</span>
}
