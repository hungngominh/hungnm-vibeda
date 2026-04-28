type StatVariant = 'mint' | 'pink' | 'blue';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  variant?: StatVariant;
}

const STAT_STYLES: Record<StatVariant, React.CSSProperties> = {
  mint: { background: 'var(--primary-fixed)',   color: 'var(--on-primary-container)' },
  pink: { background: 'var(--secondary-fixed)', color: 'var(--on-secondary-container)' },
  blue: { background: 'var(--tertiary-fixed)',  color: 'var(--on-tertiary-container)' },
};

export function StatCard({ label, value, sub, variant = 'mint' }: StatCardProps) {
  return (
    <div style={{
      textAlign: 'center', padding: 20,
      borderRadius: 'var(--r-md)',
      ...STAT_STYLES[variant],
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}
