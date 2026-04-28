interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
      padding: 24, ...style,
    }}>
      {children}
    </div>
  );
}
