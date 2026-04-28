type ChipVariant = 'mint' | 'pink' | 'blue' | 'yellow';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const CHIP_STYLES: Record<ChipVariant, React.CSSProperties> = {
  mint:   { background: 'var(--primary-fixed)',   color: 'var(--on-primary-container)' },
  pink:   { background: 'var(--secondary-fixed)', color: 'var(--on-secondary-container)' },
  blue:   { background: 'var(--tertiary-fixed)',  color: 'var(--on-tertiary-container)' },
  yellow: { background: 'var(--surface-container)', color: 'var(--on-surface)' },
};

export function Chip({ label, variant = 'mint', style, onClick }: ChipProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '8px 16px',
        borderRadius: 'var(--r-full)',
        fontSize: 12, fontWeight: 700,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...CHIP_STYLES[variant],
        ...style,
      }}
    >
      {label}
    </span>
  );
}
