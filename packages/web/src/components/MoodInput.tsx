import { useState } from 'react';
import { Button } from './Button';

interface MoodInputProps {
  onSubmit: (text: string) => Promise<void>;
  compact?: boolean;
}

export function MoodInput({ onSubmit, compact = false }: MoodInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const MAX = 500;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      await onSubmit(text.trim());
      setSubmitted(true);
      setText('');
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  const nearLimit = text.length > MAX - 50;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, MAX))}
        placeholder="Hôm nay bạn cảm thấy thế nào? (ẩn danh)"
        rows={compact ? 3 : 4}
        style={{
          width: '100%', padding: compact ? '10px 14px' : '16px 20px',
          borderRadius: 'var(--r-md)',
          border: `2px solid ${nearLimit ? 'var(--primary-fixed-dim)' : 'transparent'}`,
          background: 'var(--container-lowest)',
          boxShadow: 'var(--shadow-soft)',
          fontFamily: 'var(--font)', fontSize: compact ? 13 : 16, resize: 'none', outline: 'none',
          color: 'var(--on-surface)',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-fixed-dim)'; }}
        onBlur={e => { if (!nearLimit) e.currentTarget.style.borderColor = 'transparent'; }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: nearLimit ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          {text.length}/{MAX}
        </span>
        <Button type="submit" size={compact ? 'sm' : 'md'} disabled={loading || !text.trim()}>
          {loading ? 'Đang gửi...' : submitted ? '✓ Đã gửi!' : '✨ Gửi cảm xúc'}
        </Button>
      </div>
    </form>
  );
}
