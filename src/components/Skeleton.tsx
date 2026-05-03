interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  circle?: boolean;
}

export function Skeleton({ width = '100%', height = '1em', className = '', circle = false }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${circle ? 'skeleton-circle' : 'skeleton-text'} ${className}`}
      style={{ display: 'block', width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonKPICard() {
  return (
    <div className="kpi-card">
      <Skeleton width="60%" height="0.7em" />
      <Skeleton width="55%" height="2rem" />
      <Skeleton width="75%" height="0.75em" />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: '0.85rem 1rem' }}>
              <Skeleton width={j === 0 ? '80%' : '60%'} height="0.85em" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
