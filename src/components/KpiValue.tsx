'use client';

import { CountUp } from './CountUp';

interface KpiValueProps {
  value: number;
  prefix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}

export function KpiValue({ value, prefix, decimals = 0, style }: KpiValueProps) {
  return (
    <CountUp
      value={value}
      prefix={prefix}
      decimals={decimals}
      className="kpi-value"
      duration={600}
    />
  );
}
