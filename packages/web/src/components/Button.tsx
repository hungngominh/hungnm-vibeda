interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function Button({ variant = 'primary', size = 'md', style, ...props }: ButtonProps) {
  const pad = size === 'sm' ? '6px 14px' : '14px 32px';
  const variantStyle: React.CSSProperties =
    variant === 'primary'   ? { background: 'var(--primary-container)', color: 'var(--on-primary-container)', boxShadow: 'var(--shadow-mint)', padding: pad } :
    variant === 'secondary' ? { background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', boxShadow: 'var(--shadow-pink)', padding: pad } :
    variant === 'danger'    ? { background: '#e53935', color: '#fff', padding: pad } :
                              { background: 'transparent', color: 'var(--primary)', padding: pad };

  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font)', fontWeight: 700,
        fontSize: size === 'sm' ? 13 : 16,
        borderRadius: 'var(--r-full)',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        ...variantStyle, ...style,
      }}
      onMouseEnter={e => { if (!props.disabled) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
      onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'; }}
      onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
      {...props}
    />
  );
}
