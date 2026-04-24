type BadgeVariant = 'active' | 'draft' | 'archived' | 'processing' | 'ready' | 'error' | 'pro' | 'free' | 'studio'

interface BadgeProps {
  variant: BadgeVariant
  label?: string
}

const config: Record<BadgeVariant, { label: string; classes: string }> = {
  active:     { label: 'Active',      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  draft:      { label: 'Draft',       classes: 'bg-stone-100 text-stone-500 border-stone-200' },
  archived:   { label: 'Archived',    classes: 'bg-stone-100 text-stone-400 border-stone-200' },
  processing: { label: 'Processing',  classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready:      { label: 'Ready',       classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  error:      { label: 'Error',       classes: 'bg-red-50 text-red-600 border-red-200' },
  pro:        { label: 'Pro',         classes: 'bg-accent-light text-stone-700 border-accent' },
  free:       { label: 'Free',        classes: 'bg-stone-100 text-stone-500 border-stone-200' },
  studio:     { label: 'Studio',      classes: 'bg-stone-900 text-stone-100 border-stone-700' },
}

export function Badge({ variant, label }: BadgeProps) {
  const { label: defaultLabel, classes } = config[variant]
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-sans font-medium tracking-wide ${classes}`}>
      {label ?? defaultLabel}
    </span>
  )
}
