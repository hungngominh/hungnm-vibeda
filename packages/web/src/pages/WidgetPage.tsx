import { useState, useEffect, useRef } from 'react';
import { MoodInput } from '../components/MoodInput';
import { WordCloud } from '../components/WordCloud';
import { ModelViewer } from '../components/ModelViewer';
import { MascotPicker } from './MascotPicker';
import { api } from '../lib/api';
import { useCloudSocket } from '../hooks/useCloudSocket';
import type { MascotKey } from '../components/ModelViewer';
import type { WordItem } from '../components/WordCloud';

const W = 90, H = 110; // bubble size

function loadPos() {
  try {
    const s = localStorage.getItem('moodaily-widget-pos');
    if (s) return JSON.parse(s) as { x: number; y: number };
  } catch {}
  return { x: window.innerWidth - W - 16, y: window.innerHeight - H - 10 };
}

export function WidgetPage() {
  const [isOpen, setIsOpen]             = useState(false);
  const [showPicker, setShowPicker]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [initialWords, setInitialWords] = useState<WordItem[]>([]);
  const [pos, setPos]                   = useState<{ x: number; y: number }>(loadPos);
  const [mascot, setMascot]             = useState<MascotKey>(
    () => (localStorage.getItem('moodaily-mascot') as MascotKey | null) ?? 'chick',
  );
  const drag = useRef<{ startPX: number; startPY: number; startX: number; startY: number } | null>(null);

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

  function onBubblePointerDown(e: React.PointerEvent) {
    drag.current = { startPX: e.clientX, startPY: e.clientY, startX: pos.x, startY: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onBubblePointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const x = Math.max(0, Math.min(drag.current.startX + e.clientX - drag.current.startPX, window.innerWidth - W));
    const y = Math.max(0, Math.min(drag.current.startY + e.clientY - drag.current.startPY, window.innerHeight - H));
    setPos({ x, y });
  }

  function onBubblePointerUp(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startPX;
    const dy = e.clientY - drag.current.startPY;
    if (Math.sqrt(dx * dx + dy * dy) < 5) {
      setIsOpen(o => !o);
    } else {
      localStorage.setItem('moodaily-widget-pos', JSON.stringify(pos));
    }
    drag.current = null;
  }

  // Popup: appear above/beside bubble, clamped to viewport
  const popupW = 240;
  const popupLeft = Math.max(8, Math.min(pos.x - (popupW - W) / 2, window.innerWidth - popupW - 8));
  const popupBottom = window.innerHeight - pos.y + 8;

  return (
    <>
      <style>{`html,body{pointer-events:none;background:transparent;}`}</style>

      <div style={{ pointerEvents: 'auto' }}>

        {/* Click-outside overlay */}
        {isOpen && (
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
        )}

        {/* Popup card */}
        {isOpen && (
          <div style={{
            position: 'fixed',
            bottom: popupBottom,
            left: popupLeft,
            width: popupW,
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
          </div>
        )}

        {/* Mascot bubble */}
        <div style={{ position: 'fixed', left: pos.x, top: pos.y, width: W, height: H, zIndex: 100 }}>
          {/* Model — xoay bằng cameraControls, tap mở popup */}
          <div
            style={{ width: '100%', height: '100%' }}
            onPointerDown={(e) => { (e.currentTarget as any)._sx = e.clientX; (e.currentTarget as any)._sy = e.clientY; }}
            onPointerUp={(e) => {
              const dx = e.clientX - (e.currentTarget as any)._sx;
              const dy = e.clientY - (e.currentTarget as any)._sy;
              if (Math.sqrt(dx * dx + dy * dy) < 5) setIsOpen(o => !o);
            }}
          >
            <ModelViewer mascot={mascot} cameraControls />
          </div>

          {/* Drag handle — kéo để di chuyển */}
          <div
            style={{
              position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
              width: 28, height: 14,
              background: 'rgba(0,0,0,0.18)', borderRadius: 8,
              cursor: drag.current ? 'grabbing' : 'grab',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 3,
            }}
            onPointerDown={onBubblePointerDown}
            onPointerMove={onBubblePointerMove}
            onPointerUp={(e) => { drag.current = null; localStorage.setItem('moodaily-widget-pos', JSON.stringify(pos)); }}
          >
            {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }} />)}
          </div>
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
