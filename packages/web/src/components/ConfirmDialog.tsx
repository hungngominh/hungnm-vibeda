import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        padding: 32, maxWidth: 400, width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <p style={{ marginBottom: 24, fontWeight: 500, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>Hủy</Button>
          <Button variant="danger" onClick={onConfirm}>Xóa</Button>
        </div>
      </div>
    </div>
  );
}
