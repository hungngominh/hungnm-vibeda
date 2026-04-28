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

  const words = useCloudSocket(initialWords);
  const today = toDateStr(new Date());

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>Moodaily</span>
        <button
          onClick={() => setShowPicker(true)}
          title="Đổi linh vật"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
        >
          🎨
        </button>
      </header>

      <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        <div style={{ width: 200, height: 240, margin: '0 auto 32px' }}>
          <ModelViewer mascot={mascot} cameraControls />
        </div>

        <MoodInput onSubmit={text => api.submitMood(text)} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, margin: '32px 0 16px' }}>
          <button
            onClick={() => shiftDate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--primary)' }}
          >
            ←
          </button>
          <span style={{ fontWeight: 600, color: 'var(--text)', minWidth: 100, textAlign: 'center' }}>
            {date === today ? 'Hôm nay' : date}
          </span>
          <button
            onClick={() => shiftDate(1)}
            disabled={date >= today}
            style={{
              background: 'none', border: 'none', fontSize: 22,
              cursor: date >= today ? 'default' : 'pointer',
              color: date >= today ? 'var(--border)' : 'var(--primary)',
            }}
          >
            →
          </button>
        </div>

        {loadingWords
          ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>Đang tải...</div>
          : <WordCloud words={words} />
        }
      </main>

      {showPicker && (
        <MascotPicker current={mascot} onSelect={applyMascot} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
