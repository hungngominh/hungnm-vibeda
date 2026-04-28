interface ChipProps {
  label: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Chip({ label, style, onClick }: ChipProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-block', padding: '4px 12px', borderRadius: 20,
        fontSize: 12, fontWeight: 600,
        background: 'var(--primary-container)',
        color: 'var(--on-primary-container)',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      {label}
    </span>
  );
}
