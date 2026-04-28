import { useState, useEffect } from 'react';
import { ModelViewer, type MascotKey } from '../components/ModelViewer';
import { MoodInput } from '../components/MoodInput';
import { WordCloud } from '../components/WordCloud';
import { MascotPicker } from './MascotPicker';
import { api } from '../lib/api';
import { useCloudSocket } from '../hooks/useCloudSocket';

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string, today: string): string {
  if (dateStr === today) return 'Hôm nay';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function EmployeeHome() {
  const [mascot, setMascot] = useState<MascotKey>(
    () => (localStorage.getItem('moodaily-mascot') as MascotKey | null) ?? 'chick',
  );
  const [showPicker, setShowPicker] = useState(
    () => !localStorage.getItem('moodaily-mascot'),
  );
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [initialWords, setInitialWords] = useState<{ phrase: string; count: number }[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);

  const today = toDateStr(new Date());
  const words = useCloudSocket(initialWords, date === today);

  function applyMascot(key: MascotKey) {
    setMascot(key);
    localStorage.setItem('moodaily-mascot', key);
    document.documentElement.dataset.theme = key;
  }

  useEffect(() => {
    document.documentElement.dataset.theme = mascot;
  }, [mascot]);

  useEffect(() => {
    setLoadingWords(true);
    api.getCloud(date)
      .then(d => { setInitialWords(d.words); setLoadingWords(false); })
      .catch(() => setLoadingWords(false));
  }, [date]);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(toDateStr(d));
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--surface)' }}>

      {/* Decorative blob — top right (pink) */}
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 280, height: 280, borderRadius: '50%',
        background: 'var(--secondary-fixed)',
        opacity: 0.5, filter: 'blur(60px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Decorative blob — bottom left (mint) */}
      <div style={{
        position: 'absolute', bottom: -100, left: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'var(--primary-fixed)',
        opacity: 0.5, filter: 'blur(60px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: 720, margin: '0 auto',
        padding: '32px var(--pad-container) 100px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Mascot */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, gap: 10 }}>
          <div style={{ width: 220, height: 260 }}>
            <ModelViewer mascot={mascot} cameraControls />
          </div>
          <button
            onClick={() => setShowPicker(true)}
            style={{
              background: 'var(--container-lowest)',
              border: '1.5px solid var(--outline-variant)',
              borderRadius: 'var(--r-full)',
              padding: '8px 20px',
              fontSize: 14, fontWeight: 600,
              color: 'var(--on-surface)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            🐾 Đổi linh vật
          </button>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 32, fontWeight: 800,
          color: 'var(--on-surface)', letterSpacing: '-0.02em',
          marginBottom: 6, textAlign: 'center',
        }}>
          Hôm nay của bạn thế nào?
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 16, fontWeight: 500,
          color: 'var(--on-surface-variant)',
          marginBottom: 24, textAlign: 'center',
        }}>
          Chia sẻ ẩn danh — từng cụm cảm xúc sẽ bay vào mây bên dưới
        </p>

        {/* Mood input — centered, max 540px */}
        <div style={{ width: '100%', maxWidth: 540 }}>
          <MoodInput onSubmit={async (text) => { await api.submitMood(text); }} />
        </div>

        {/* Cloud section */}
        <div style={{ width: '100%', marginTop: 32 }}>

          {/* Cloud header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 'var(--stack-sm)', padding: '0 4px',
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: 'var(--on-surface-variant)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              ☁️ Mây cảm xúc của cả nhà
            </span>

            {/* Date pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2,
              background: 'var(--container-lowest)',
              borderRadius: 'var(--r-full)',
              boxShadow: 'var(--shadow-soft)',
              padding: '6px 10px',
            }}>
              <button
                onClick={() => shiftDate(-1)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, color: 'var(--primary)', padding: '0 4px', lineHeight: 1,
                }}
              >←</button>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: 'var(--on-surface)',
                minWidth: 96, textAlign: 'center',
              }}>
                📅 {formatDateLabel(date, today)}
              </span>
              <button
                onClick={() => shiftDate(1)}
                disabled={date >= today}
                style={{
                  background: 'none', border: 'none',
                  fontSize: 14, padding: '0 4px', lineHeight: 1,
                  cursor: date >= today ? 'default' : 'pointer',
                  color: date >= today ? 'var(--outline-variant)' : 'var(--primary)',
                }}
              >→</button>
            </div>
          </div>

          {/* Word cloud or loading state */}
          {loadingWords ? (
            <div style={{
              background: 'var(--container-lowest)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-soft)',
              minHeight: 280,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--on-surface-variant)', fontSize: 15,
            }}>
              Đang tải...
            </div>
          ) : (
            <WordCloud words={words} />
          )}
        </div>
      </main>


      {/* Widget iframe overlay */}
      <iframe
        src="/widget"
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          border: 'none', zIndex: 100,
          background: 'transparent',
          pointerEvents: 'none',
        }}
        // @ts-expect-error allowtransparency is non-standard
        allowTransparency="true"
      />

      {showPicker && (
        <MascotPicker current={mascot} onSelect={applyMascot} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
