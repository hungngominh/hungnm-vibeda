import { ModelViewer, type MascotKey } from '../components/ModelViewer';

const MASCOTS: { key: MascotKey; label: string; primary: string }[] = [
  { key: 'chick',   label: '🐥 Chick',    primary: '#b8690a' },
  { key: 'axolotl', label: '🦎 Axolotl',  primary: '#c0284a' },
  { key: 'mocha',   label: '🐱 Mocha Cat', primary: '#7a5230' },
  { key: 'whale',   label: '🐋 Whale',    primary: '#1e6fa8' },
];

interface MascotPickerProps {
  current: MascotKey;
  onSelect: (key: MascotKey) => void;
  onClose?: () => void;
}

export function MascotPicker({ current, onSelect, onClose }: MascotPickerProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 900, padding: 24,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 24, padding: 32,
        maxWidth: 580, width: '100%', boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8, color: 'var(--text)' }}>
          Chọn linh vật
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>
          Theme màu sắc sẽ thay đổi theo linh vật bạn chọn
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {MASCOTS.map(m => (
            <button
              key={m.key}
              onClick={() => { onSelect(m.key); onClose?.(); }}
              style={{
                background: current === m.key ? m.primary + '1a' : '#fff',
                border: `${current === m.key ? 2.5 : 1.5}px solid ${current === m.key ? m.primary : 'var(--border)'}`,
                borderRadius: 16, padding: '16px 12px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 100, height: 120 }}>
                <ModelViewer mascot={m.key} />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 14 }}>
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: 'block', margin: '24px auto 0', background: 'none',
              border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: 14,
            }}
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}
