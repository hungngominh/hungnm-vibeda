interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: 'var(--container-lowest)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-soft)',
      padding: 'var(--pad-container)',
      ...style,
    }}>
      {children}
    </div>
  );
}
