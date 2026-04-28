interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function Button({ variant = 'primary', size = 'md', style, ...props }: ButtonProps) {
  const pad = size === 'sm' ? '6px 14px' : '10px 22px';
  const variantStyle: React.CSSProperties =
    variant === 'primary'   ? { background: 'var(--primary)', color: '#fff', padding: pad } :
    variant === 'secondary' ? { background: 'var(--secondary-container)', color: 'var(--on-primary-container)', padding: pad } :
    variant === 'danger'    ? { background: '#e53935', color: '#fff', padding: pad } :
                              { background: 'transparent', color: 'var(--primary)', padding: pad };

  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
        fontWeight: 600, borderRadius: 'var(--radius-sm)',
        transition: 'opacity 0.15s', fontSize: size === 'sm' ? 13 : 15,
        ...variantStyle, ...style,
      }}
      {...props}
    />
  );
}
