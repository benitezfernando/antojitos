import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KpiValue } from '@/components/KpiValue';

type KpiTone = 'neutral' | 'success' | 'warning' | 'destructive';

const TONE_ICON_CLASS: Record<KpiTone, string> = {
  neutral: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

const TONE_SUB_CLASS: Record<KpiTone, string> = {
  neutral: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

interface KpiTileProps {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  decimals?: number;
  sub: string;
  /** Semantic tone driven by the metric's actual state — defaults to neutral (brand green). */
  tone?: KpiTone;
}

/**
 * Shared KPI card: icon badge + uppercase label + big value + sub-caption.
 * `tone` must reflect what the number means (success at a "good" value,
 * destructive/warning at a "bad" one) — never a decorative color pick.
 */
export function KpiTile({ icon: Icon, label, value, prefix, decimals = 0, sub, tone = 'neutral' }: KpiTileProps) {
  return (
    <div data-slot="card" className="relative rounded-xl p-5">
      <div className={cn('absolute top-3.5 right-4 flex size-8 items-center justify-center rounded-full', TONE_ICON_CLASS[tone])}>
        <Icon className="size-3.5" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="my-1 text-2xl font-extrabold leading-tight tracking-tight text-foreground">
        <KpiValue value={value} prefix={prefix} decimals={decimals} />
      </div>
      <span className={cn('text-sm font-medium', TONE_SUB_CLASS[tone])}>{sub}</span>
    </div>
  );
}
