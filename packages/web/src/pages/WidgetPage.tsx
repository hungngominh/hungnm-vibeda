import { useState, useEffect } from 'react';
import { MoodInput } from '../components/MoodInput';
import { WordCloud } from '../components/WordCloud';
import { ModelViewer } from '../components/ModelViewer';
import { MascotPicker } from './MascotPicker';
import { api } from '../lib/api';
import { useCloudSocket } from '../hooks/useCloudSocket';
import type { MascotKey } from '../components/ModelViewer';
import type { WordItem } from '../components/WordCloud';

const MASCOT_EMOJI: Record<MascotKey, string> = {
  chick:   '🐥',
  axolotl: '🦎',
  mocha:   '🐱',
  whale:   '🐋',
};

export function WidgetPage() {
  const [isOpen, setIsOpen]             = useState(false);
  const [showPicker, setShowPicker]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [initialWords, setInitialWords] = useState<WordItem[]>([]);
  const [mascot, setMascot]             = useState<MascotKey>(
    () => (localStorage.getItem('moodaily-mascot') as MascotKey | null) ?? 'chick',
  );

  const today = new Date().toISOString().slice(0, 10);
  const words = useCloudSocket(initialWords, true);

  useEffect(() => {
    document.documentElement.dataset.theme = mascot;
  }, [mascot]);

  useEffect(() => {
    if (!isOpen) return;
    api.getCloud(today).then(d => setInitialWords(d.words)).catch(() => {});
  }, [isOpen, today]);

  function applyMascot(key: MascotKey) {
    setMascot(key);
    localStorage.setItem('moodaily-mascot', key);
    document.documentElement.dataset.theme = key;
  }

  async function handleSubmit(text: string) {
    await api.submitMood(text);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }

  return (
    <>
      {/* Make html/body click-transparent so iframe doesn't block parent page */}
      <style>{`html,body{pointer-events:none;background:transparent;}`}</style>

      {/* Widget root — re-enables pointer events */}
      <div style={{ pointerEvents: 'auto' }}>

        {/* Click-outside overlay */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 98 }}
          />
        )}

        {/* Popup card */}
        {isOpen && (
          <div style={{
            position: 'fixed', bottom: 92, right: 14,
            width: 240,
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex', flexDirection: 'column',
            background: 'var(--surface)',
            borderRadius: 18,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            zIndex: 99,
            animation: 'widgetOpen 0.2s ease',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary-fixed), var(--secondary-fixed))',
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--surface)',
                overflow: 'hidden', flexShrink: 0,
              }}>
                <ModelViewer mascot={mascot} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface)' }}>
                  Hôm nay bạn thế nào?
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--on-surface-variant)' }}>
                  Chia sẻ ẩn danh
                </div>
              </div>
              <button
                onClick={() => setShowPicker(true)}
                style={{
                  background: 'var(--surface)', border: 'none', borderRadius: 20,
                  padding: '3px 8px', fontSize: 10, fontWeight: 600,
                  color: 'var(--primary)', cursor: 'pointer', flexShrink: 0,
                }}
              >
                🎭 Đổi
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '10px 12px', overflowY: 'auto', flex: 1 }}>
              {submitted ? (
                <div style={{
                  textAlign: 'center', padding: '8px 0',
                  color: 'var(--primary)', fontWeight: 700, fontSize: 14,
                }}>
                  Đã gửi ✓
                </div>
              ) : (
                <MoodInput onSubmit={handleSubmit} compact />
              )}
              <div style={{ marginTop: 8 }}>
                <WordCloud words={words} height={160} />
              </div>
            </div>

            {/* Arrow pointing down to bubble */}
            <div style={{
              position: 'absolute', bottom: -6, right: 26,
              width: 12, height: 12,
              background: 'var(--surface)',
              transform: 'rotate(45deg)',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.06)',
            }} />
          </div>
        )}

        {/* Mascot bubble — drag xoay, tap ngắn mở popup */}
        <div
          style={{ position: 'fixed', bottom: 20, right: 20, width: 80, height: 80, zIndex: 100 }}
          onPointerDown={(e) => { (e.currentTarget as any)._startX = e.clientX; (e.currentTarget as any)._startY = e.clientY; }}
          onPointerUp={(e) => {
            const dx = e.clientX - (e.currentTarget as any)._startX;
            const dy = e.clientY - (e.currentTarget as any)._startY;
            if (Math.sqrt(dx * dx + dy * dy) < 5) setIsOpen(o => !o);
          }}
        >
          <ModelViewer mascot={mascot} cameraControls />
        </div>

        <style>{`
          @keyframes widgetOpen {
            from { opacity: 0; transform: scale(0.85) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {showPicker && (
          <MascotPicker
            current={mascot}
            onSelect={applyMascot}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </>
  );
}
