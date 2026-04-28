import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <Card style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--primary)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}
