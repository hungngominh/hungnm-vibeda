import { useState } from 'react';
import { Button } from './Button';

interface MoodInputProps {
  onSubmit: (text: string) => Promise<void>;
}

export function MoodInput({ onSubmit }: MoodInputProps) {
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
        rows={4}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${nearLimit ? 'var(--primary)' : 'var(--border)'}`,
          fontFamily: 'var(--font)', fontSize: 15, resize: 'none', outline: 'none',
          background: 'var(--surface)', color: 'var(--text)',
          transition: 'border-color 0.2s',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: nearLimit ? 'var(--primary)' : 'var(--text-secondary)' }}>
          {text.length}/{MAX}
        </span>
        <Button type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Đang gửi...' : submitted ? '✓ Đã gửi!' : 'Gửi cảm xúc'}
        </Button>
      </div>
    </form>
  );
}
