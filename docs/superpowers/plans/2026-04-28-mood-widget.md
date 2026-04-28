# Mood Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo route `/widget` — mascot bubble cố định góc dưới-phải, bấm mở popup với mood input + word cloud, nhúng được vào EmployeeHome qua iframe.

**Architecture:** `WidgetPage.tsx` tự chứa toàn bộ logic (mascot state, open/close, data fetching). Page dùng `pointer-events: none` trên `html/body` để clicks xuyên qua iframe; chỉ widget elements có `pointer-events: auto`. Reuse `WordCloud`, `MoodInput`, `MascotPicker`, `useCloudSocket`, `api` không sửa — chỉ thêm optional `height` prop cho `WordCloud`.

**Tech Stack:** React + TypeScript, Vite, react-router-dom, d3-cloud, existing design tokens (CSS vars)

---

## File Map

| File | Action | Nội dung |
|------|--------|----------|
| `packages/web/src/components/WordCloud.tsx` | Modify | Thêm optional `height?: number` prop (default 320) |
| `packages/web/src/pages/WidgetPage.tsx` | Create | Widget page hoàn chỉnh |
| `packages/web/src/App.tsx` | Modify | Thêm route `/widget` |
| `packages/web/src/pages/EmployeeHome.tsx` | Modify | Thêm `<iframe src="/widget">` để test |

---

## Task 1: Thêm `height` prop cho WordCloud

**Files:**
- Modify: `packages/web/src/components/WordCloud.tsx`

- [ ] **Step 1: Sửa `WordCloudProps` và thay `CLOUD_HEIGHT`**

Thay toàn bộ nội dung file:

```typescript
import cloud from 'd3-cloud';
import { useEffect, useRef, useState } from 'react';

export interface WordItem {
  phrase: string;
  count: number;
}

interface D3Word {
  text?: string;
  size?: number;
  x?: number;
  y?: number;
  rotate?: number;
  color: string;
}

interface LayoutWord {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
}

const WORD_COLORS = ['var(--primary)', 'var(--secondary)', 'var(--tertiary)'];

interface WordCloudProps {
  words: WordItem[];
  height?: number;
}

export function WordCloud({ words, height = 320 }: WordCloudProps) {
  const [layoutWords, setLayoutWords] = useState<LayoutWord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!words.length) {
      setLayoutWords([]);
      return;
    }

    const maxCount = Math.max(...words.map(w => w.count));
    const minCount = Math.min(...words.map(w => w.count));
    const sizeScale = (count: number) =>
      maxCount === minCount ? 24 : Math.round(13 + ((count - minCount) / (maxCount - minCount)) * 24);

    const width = containerRef.current?.offsetWidth ?? 560;

    (cloud as any)()
      .size([width, height])
      .words(
        words.map((w, i) => ({
          text: w.phrase,
          size: sizeScale(w.count),
          color: WORD_COLORS[i % WORD_COLORS.length],
        }))
      )
      .padding(10)
      .rotate(() => (Math.random() > 0.8 ? 90 : 0))
      .font('Plus Jakarta Sans')
      .fontSize((d: D3Word) => d.size ?? 16)
      .on('end', (output: D3Word[]) => {
        setLayoutWords(
          output.map(d => ({
            text: d.text ?? '',
            size: d.size ?? 16,
            x: (d.x ?? 0) + width / 2,
            y: (d.y ?? 0) + height / 2,
            rotate: d.rotate ?? 0,
            color: d.color,
          }))
        );
      })
      .start();
  }, [words, height]);

  return (
    <div
      ref={containerRef}
      style={{
        background: 'var(--container-lowest)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-soft)',
        padding: '36px 20px',
        minHeight: height + 72,
        position: 'relative',
      }}
    >
      {words.length === 0 ? (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--on-surface-variant)', fontSize: 15,
        }}>
          Chưa có cảm xúc nào được chia sẻ hôm nay
        </div>
      ) : (
        <div style={{ position: 'relative', height }}>
          {layoutWords.map(({ text, size, x, y, rotate, color }) => (
            <span
              key={text}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                fontSize: size,
                fontWeight: 800,
                color,
                transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
                lineHeight: 1,
                letterSpacing: '-0.01em',
                userSelect: 'none',
                cursor: 'default',
                whiteSpace: 'nowrap',
              }}
            >
              {text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd e:/Working/Moodaily && pnpm --filter web tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily && git add packages/web/src/components/WordCloud.tsx
git commit -m "feat(web): WordCloud — add optional height prop (default 320)"
```

---

## Task 2: Tạo WidgetPage

**Files:**
- Create: `packages/web/src/pages/WidgetPage.tsx`

- [ ] **Step 1: Tạo file**

```typescript
import { useState, useEffect } from 'react';
import { MoodInput } from '../components/MoodInput';
import { WordCloud } from '../components/WordCloud';
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
  const [isOpen, setIsOpen]           = useState(false);
  const [showPicker, setShowPicker]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [initialWords, setInitialWords] = useState<WordItem[]>([]);
  const [mascot, setMascot]           = useState<MascotKey>(
    () => (localStorage.getItem('moodaily-mascot') as MascotKey | null) ?? 'chick',
  );

  const today = new Date().toISOString().slice(0, 10);
  const words = useCloudSocket(initialWords, true);

  useEffect(() => {
    document.documentElement.dataset.theme = mascot;
  }, [mascot]);

  // Load cloud data when popup first opens
  useEffect(() => {
    if (!isOpen) return;
    api.getCloud(today).then(d => setInitialWords(d.words)).catch(() => {});
  }, [isOpen]);

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
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {MASCOT_EMOJI[mascot]}
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
            <div style={{ padding: '10px 12px' }}>
              {submitted ? (
                <div style={{
                  textAlign: 'center', padding: '8px 0',
                  color: 'var(--primary)', fontWeight: 700, fontSize: 14,
                }}>
                  Đã gửi ✓
                </div>
              ) : (
                <MoodInput onSubmit={handleSubmit} />
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

        {/* Mascot bubble button */}
        <button
          onClick={() => setIsOpen(o => !o)}
          style={{
            position: 'fixed', bottom: 20, right: 20,
            width: 62, height: 62, borderRadius: '50%',
            background: 'var(--primary)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            fontSize: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
          }}
        >
          {MASCOT_EMOJI[mascot]}
        </button>

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
```

- [ ] **Step 2: Build check**

```bash
cd e:/Working/Moodaily && pnpm --filter web tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily && git add packages/web/src/pages/WidgetPage.tsx
git commit -m "feat(web): WidgetPage — mascot bubble + popup với mood input và word cloud"
```

---

## Task 3: Wiring — Route + EmployeeHome iframe

**Files:**
- Modify: `packages/web/src/App.tsx`
- Modify: `packages/web/src/pages/EmployeeHome.tsx`

- [ ] **Step 1: Thêm route `/widget` vào App.tsx**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EmployeeHome } from './pages/EmployeeHome';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { WidgetPage } from './pages/WidgetPage';

export function App() {
  const hasToken = Boolean(localStorage.getItem('moodaily-token'));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmployeeHome />} />
        <Route path="/widget" element={<WidgetPage />} />
        <Route
          path="/admin"
          element={hasToken ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />}
        />
        <Route
          path="/admin/dashboard"
          element={hasToken ? <AdminDashboard /> : <Navigate to="/admin" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Thêm iframe vào EmployeeHome**

Trong `packages/web/src/pages/EmployeeHome.tsx`, ngay trước closing `</div>` của outer div (trước dòng `{showPicker && ...}`):

```typescript
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
        // @ts-expect-error allowtransparency is non-standard but needed for transparent iframe bg
        allowTransparency="true"
      />
```

- [ ] **Step 3: Build check**

```bash
cd e:/Working/Moodaily && pnpm --filter web tsc --noEmit
```

Expected: no errors (có thể có 1 TS warning về `allowTransparency` — dùng `@ts-expect-error` ở trên để suppress)

- [ ] **Step 4: Commit**

```bash
cd e:/Working/Moodaily && git add packages/web/src/App.tsx packages/web/src/pages/EmployeeHome.tsx
git commit -m "feat(web): wire /widget route and embed iframe in EmployeeHome"
```

---

## Task 4: Kiểm tra thủ công

- [ ] **Step 1: Khởi động dev server**

```bash
cd e:/Working/Moodaily && pnpm dev
```

- [ ] **Step 2: Mở http://localhost:5173 — kiểm tra EmployeeHome**

Kiểm tra:
1. Mascot bubble 🐥 hiện ở góc dưới-phải
2. Bấm bubble → popup mở với animation
3. Trang EmployeeHome vẫn scroll/interact được bình thường (iframe click-through hoạt động)
4. Gõ text trong popup → bấm Gửi → hiện "Đã gửi ✓" 2 giây → word cloud cập nhật
5. Bấm "🎭 Đổi" → MascotPicker mở → chọn mascot khác → bubble và popup cập nhật
6. Bấm ngoài popup → popup đóng

- [ ] **Step 3: Mở http://localhost:5173/widget trực tiếp**

Kiểm tra: background trong suốt (thấy màu trắng của browser), bubble hiện, popup hoạt động.

- [ ] **Step 4: Commit cuối nếu có hotfix nhỏ**

```bash
cd e:/Working/Moodaily && git add -p && git commit -m "fix(web): widget — <mô tả hotfix>"
```
