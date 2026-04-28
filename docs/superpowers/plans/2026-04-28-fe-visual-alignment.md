# FE Visual Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align all React frontend components and pages with the approved Kawaii Design System v3 (`design-preview.html`).

**Architecture:** Token-first approach — update `themes.css` with the full Material 3 token set first, then update each component bottom-up (primitives → composites → pages). All changes use the existing inline-style pattern; no CSS modules or class migrations.

**Tech Stack:** React 18, TypeScript, Vite, `d3-cloud` (new dependency for word cloud layout)

**Spec:** `docs/superpowers/specs/2026-04-28-fe-visual-alignment-design.md`

---

### Task 1: Install d3-cloud

**Files:**
- Modify: `packages/web/package.json` (via pnpm)

- [ ] **Step 1: Install d3-cloud and its types**

```bash
cd e:/Working/Moodaily
pnpm add d3-cloud --filter @moodaily/web
pnpm add -D @types/d3-cloud --filter @moodaily/web
```

Expected: `packages/web/package.json` now has `"d3-cloud"` in dependencies and `"@types/d3-cloud"` in devDependencies.

- [ ] **Step 2: Verify TypeScript can see the types**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: build succeeds (no new errors from d3-cloud).

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add d3-cloud for word cloud layout"
```

---

### Task 2: Rewrite themes.css — full Material 3 token set

**Files:**
- Modify: `packages/web/src/themes.css`

- [ ] **Step 1: Replace the entire file with the full token set**

```css
/* ═══════════════════════════════════════════
   Moodaily — Design Tokens (Material 3 / Kawaii v3)
   ═══════════════════════════════════════════ */

/* Shared scale tokens — not theme-specific */
:root {
  --font: 'Plus Jakarta Sans', sans-serif;

  --r-sm:   0.5rem;   /* 8px  */
  --r:      1rem;     /* 16px */
  --r-md:   1.5rem;   /* 24px */
  --r-lg:   2rem;     /* 32px */
  --r-xl:   3rem;     /* 48px */
  --r-full: 9999px;

  --pad-container: 24px;
  --stack-sm:      12px;
  --stack-md:      20px;
}

/* ── Chick (warm yellow + mint) — matches design-preview exactly ── */
:root,
[data-theme="chick"] {
  --surface:            #fff9ea;
  --surface-container:  #faefb8;
  --container-lowest:   #ffffff;

  --on-surface:         #201c00;
  --on-surface-variant: #3e4945;
  --outline:            #6e7a74;
  --outline-variant:    #bec9c3;

  --primary:              #006b55;
  --primary-container:    #87dcc0;
  --primary-fixed:        #9ef3d6;
  --primary-fixed-dim:    #82d7bb;
  --on-primary:           #ffffff;
  --on-primary-container: #00624d;

  --secondary:              #864d61;
  --secondary-container:    #fdb5cc;
  --secondary-fixed:        #ffd9e3;
  --secondary-fixed-dim:    #fab3ca;
  --on-secondary:           #ffffff;
  --on-secondary-container: #7a4357;

  --tertiary:              #30628a;
  --tertiary-container:    #a1d1fe;
  --tertiary-fixed:        #cde5ff;
  --on-tertiary:           #ffffff;
  --on-tertiary-container: #265a81;

  --shadow-soft: 0 4px 18px rgba(134, 77, 97, 0.08);
  --shadow-mint: 0 8px 24px rgba(0, 107, 85, 0.15);
  --shadow-pink: 0 8px 24px rgba(134, 77, 97, 0.15);
}

/* ── Axolotl (pink/red) ── */
[data-theme="axolotl"] {
  --surface:            #fff0f2;
  --surface-container:  #f5d0d8;
  --container-lowest:   #ffffff;

  --on-surface:         #3d0015;
  --on-surface-variant: #8a3a50;
  --outline:            #d080a0;
  --outline-variant:    #f0c0ca;

  --primary:              #c0284a;
  --primary-container:    #f5b8c4;
  --primary-fixed:        #ffd8de;
  --primary-fixed-dim:    #f5b8c4;
  --on-primary:           #ffffff;
  --on-primary-container: #6b0020;

  --secondary:              #d4607a;
  --secondary-container:    #fad4dc;
  --secondary-fixed:        #ffe0e8;
  --secondary-fixed-dim:    #f5c0cc;
  --on-secondary:           #ffffff;
  --on-secondary-container: #8a3050;

  --tertiary:              #6050a0;
  --tertiary-container:    #c8b8f0;
  --tertiary-fixed:        #e0d8f8;
  --on-tertiary:           #ffffff;
  --on-tertiary-container: #3a2880;

  --shadow-soft: 0 4px 18px rgba(192, 40, 74, 0.08);
  --shadow-mint: 0 8px 24px rgba(192, 40, 74, 0.15);
  --shadow-pink: 0 8px 24px rgba(212, 96, 122, 0.15);
}

/* ── Mocha (warm brown) ── */
[data-theme="mocha"] {
  --surface:            #fdf5ec;
  --surface-container:  #f0e0c8;
  --container-lowest:   #ffffff;

  --on-surface:         #2e1800;
  --on-surface-variant: #7a5230;
  --outline:            #c0a080;
  --outline-variant:    #e0c4a0;

  --primary:              #7a5230;
  --primary-container:    #e0c4a0;
  --primary-fixed:        #f5dcc0;
  --primary-fixed-dim:    #e0c4a0;
  --on-primary:           #ffffff;
  --on-primary-container: #3d2210;

  --secondary:              #c4956a;
  --secondary-container:    #f5e0cc;
  --secondary-fixed:        #faecd4;
  --secondary-fixed-dim:    #f0d8b8;
  --on-secondary:           #ffffff;
  --on-secondary-container: #8a5030;

  --tertiary:              #4a6880;
  --tertiary-container:    #b0c8e0;
  --tertiary-fixed:        #d8e8f4;
  --on-tertiary:           #ffffff;
  --on-tertiary-container: #284858;

  --shadow-soft: 0 4px 18px rgba(122, 82, 48, 0.08);
  --shadow-mint: 0 8px 24px rgba(122, 82, 48, 0.15);
  --shadow-pink: 0 8px 24px rgba(196, 149, 106, 0.15);
}

/* ── Whale (ocean blue) ── */
[data-theme="whale"] {
  --surface:            #f0f6ff;
  --surface-container:  #d0e8f8;
  --container-lowest:   #ffffff;

  --on-surface:         #0a2840;
  --on-surface-variant: #2a5a7a;
  --outline:            #80b0d8;
  --outline-variant:    #b8d8f0;

  --primary:              #1e6fa8;
  --primary-container:    #7ec4ef;
  --primary-fixed:        #cde5ff;
  --primary-fixed-dim:    #a1d1fe;
  --on-primary:           #ffffff;
  --on-primary-container: #0d3d62;

  --secondary:              #2e8b7a;
  --secondary-container:    #a8e6df;
  --secondary-fixed:        #c8f0ea;
  --secondary-fixed-dim:    #a0e0d8;
  --on-secondary:           #ffffff;
  --on-secondary-container: #1a5850;

  --tertiary:              #7060b0;
  --tertiary-container:    #c8c0e8;
  --tertiary-fixed:        #e0d8f8;
  --on-tertiary:           #ffffff;
  --on-tertiary-container: #4030a0;

  --shadow-soft: 0 4px 18px rgba(30, 111, 168, 0.08);
  --shadow-mint: 0 8px 24px rgba(30, 111, 168, 0.15);
  --shadow-pink: 0 8px 24px rgba(46, 139, 122, 0.15);
}

/* ── Global reset ── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font);
  background: var(--surface);
  color: var(--on-surface);
  min-height: 100vh;
  transition: background 0.3s ease, color 0.3s ease;
}
```

- [ ] **Step 2: Verify build**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: TypeScript compilation succeeds. There will be warnings about old variable names used in other files — those are fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/themes.css
git commit -m "style(web): replace token set with full Material 3 / Kawaii v3 variables"
```

---

### Task 3: Update Card component

**Files:**
- Modify: `packages/web/src/components/Card.tsx`

- [ ] **Step 1: Replace with updated token names**

```tsx
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: 'var(--container-lowest)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-soft)',
      padding: 'var(--pad-container)',
      ...style,
    }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/components/Card.tsx
git commit -m "style(web): update Card to use new token names (container-lowest, r-lg, shadow-soft)"
```

---

### Task 4: Update Button component

**Files:**
- Modify: `packages/web/src/components/Button.tsx`

- [ ] **Step 1: Replace with pill shape, new variants, hover animation**

```tsx
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
```

- [ ] **Step 2: Verify build**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/components/Button.tsx
git commit -m "style(web): Button — pill shape, updated padding, mint/pink shadows, hover animation"
```

---

### Task 5: Update Chip component

**Files:**
- Modify: `packages/web/src/components/Chip.tsx`

- [ ] **Step 1: Add variant prop with mint/pink/blue/yellow styles**

```tsx
type ChipVariant = 'mint' | 'pink' | 'blue' | 'yellow';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const CHIP_STYLES: Record<ChipVariant, React.CSSProperties> = {
  mint:   { background: 'var(--primary-fixed)',   color: 'var(--on-primary-container)' },
  pink:   { background: 'var(--secondary-fixed)', color: 'var(--on-secondary-container)' },
  blue:   { background: 'var(--tertiary-fixed)',  color: 'var(--on-tertiary-container)' },
  yellow: { background: 'var(--surface-container)', color: 'var(--on-surface)' },
};

export function Chip({ label, variant = 'mint', style, onClick }: ChipProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '8px 16px',
        borderRadius: 'var(--r-full)',
        fontSize: 12, fontWeight: 700,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...CHIP_STYLES[variant],
        ...style,
      }}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: PASS. The existing `AdminDashboard.tsx` call site passes `style` prop — that still works.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/components/Chip.tsx
git commit -m "feat(web): Chip — add variant prop (mint/pink/blue/yellow), pill shape"
```

---

### Task 6: Update StatCard component

**Files:**
- Modify: `packages/web/src/components/StatCard.tsx`

- [ ] **Step 1: Add variant prop, drop Card dependency, use token-based colors**

```tsx
type StatVariant = 'mint' | 'pink' | 'blue';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  variant?: StatVariant;
}

const STAT_STYLES: Record<StatVariant, React.CSSProperties> = {
  mint: { background: 'var(--primary-fixed)',   color: 'var(--on-primary-container)' },
  pink: { background: 'var(--secondary-fixed)', color: 'var(--on-secondary-container)' },
  blue: { background: 'var(--tertiary-fixed)',  color: 'var(--on-tertiary-container)' },
};

export function StatCard({ label, value, sub, variant = 'mint' }: StatCardProps) {
  return (
    <div style={{
      textAlign: 'center', padding: 20,
      borderRadius: 'var(--r-md)',
      ...STAT_STYLES[variant],
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/components/StatCard.tsx
git commit -m "feat(web): StatCard — add variant prop (mint/pink/blue), token-based colors"
```

---

### Task 7: Update EntryTable component

**Files:**
- Modify: `packages/web/src/components/EntryTable.tsx`

- [ ] **Step 1: Replace old token names, update delete button and chip**

```tsx
import { Chip } from './Chip';
import { Button } from './Button';

export interface EntryRow {
  id: string;
  logCreatedDate: string;
  rawText: string;
  _clusterCount?: number;
}

interface EntryTableProps {
  entries: EntryRow[];
  onDelete: (id: string) => void;
}

export function EntryTable({ entries, onDelete }: EntryTableProps) {
  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--on-surface-variant)', fontSize: 14 }}>
        Không có entries
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px', textAlign: 'left',
    color: 'var(--on-surface-variant)', fontWeight: 600, fontSize: 13,
  };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid var(--outline-variant)` }}>
            <th style={thStyle}>Thời gian</th>
            <th style={thStyle}>Nội dung</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Cụm</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Xóa</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id} style={{ borderBottom: `1px solid var(--outline-variant)` }}>
              <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: 'var(--on-surface-variant)' }}>
                {new Date(entry.logCreatedDate).toLocaleString('vi-VN')}
              </td>
              <td style={{ ...tdStyle, maxWidth: 400 }}>
                {entry.rawText.length > 80 ? entry.rawText.slice(0, 80) + '…' : entry.rawText}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <Chip label={String(entry._clusterCount ?? 0)} variant="mint" style={{ fontSize: 10, padding: '4px 10px' }} />
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <Button variant="secondary" size="sm" onClick={() => onDelete(entry.id)}>
                  Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/components/EntryTable.tsx
git commit -m "style(web): EntryTable — update token names, delete button to secondary variant"
```

---

### Task 8: Update MoodInput component

**Files:**
- Modify: `packages/web/src/components/MoodInput.tsx`

- [ ] **Step 1: Replace file with updated textarea styling**

```tsx
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
          width: '100%', padding: '16px 20px',
          borderRadius: 'var(--r-md)',
          border: `2px solid ${nearLimit ? 'var(--primary-fixed-dim)' : 'transparent'}`,
          background: 'var(--container-lowest)',
          boxShadow: 'var(--shadow-soft)',
          fontFamily: 'var(--font)', fontSize: 16, resize: 'none', outline: 'none',
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
        <Button type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Đang gửi...' : submitted ? '✓ Đã gửi!' : '✨ Gửi cảm xúc'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/components/MoodInput.tsx
git commit -m "style(web): MoodInput — container-lowest background, transparent border, focus highlight"
```

---

### Task 9: Rewrite WordCloud component with d3-cloud

**Files:**
- Modify: `packages/web/src/components/WordCloud.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import cloud from 'd3-cloud';
import { useEffect, useRef, useState } from 'react';

export interface WordItem {
  phrase: string;
  count: number;
}

// Extend d3-cloud's Word with our custom color field
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
const CLOUD_HEIGHT = 280;

interface WordCloudProps {
  words: WordItem[];
}

export function WordCloud({ words }: WordCloudProps) {
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
      maxCount === minCount ? 28 : Math.round(16 + ((count - minCount) / (maxCount - minCount)) * 32);

    const width = containerRef.current?.offsetWidth ?? 560;

    cloud<D3Word>()
      .size([width, CLOUD_HEIGHT])
      .words(
        words.map((w, i) => ({
          text: w.phrase,
          size: sizeScale(w.count),
          color: WORD_COLORS[i % WORD_COLORS.length],
        }))
      )
      .padding(6)
      .rotate(() => (Math.random() > 0.7 ? 90 : 0))
      .font('Plus Jakarta Sans')
      .fontSize(d => d.size ?? 16)
      .on('end', (output: D3Word[]) => {
        setLayoutWords(
          output.map(d => ({
            text: d.text ?? '',
            size: d.size ?? 16,
            x: (d.x ?? 0) + width / 2,
            y: (d.y ?? 0) + CLOUD_HEIGHT / 2,
            rotate: d.rotate ?? 0,
            color: d.color,
          }))
        );
      })
      .start();
  }, [words]);

  return (
    <div
      ref={containerRef}
      style={{
        background: 'var(--container-lowest)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-soft)',
        padding: '36px 20px',
        minHeight: CLOUD_HEIGHT + 72,
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
        <div style={{ position: 'relative', height: CLOUD_HEIGHT }}>
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

- [ ] **Step 2: Verify build**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/components/WordCloud.tsx
git commit -m "feat(web): WordCloud — rewrite with d3-cloud for scattered/rotated layout, 3-color words"
```

---

### Task 10: Rebuild EmployeeHome page

**Files:**
- Modify: `packages/web/src/pages/EmployeeHome.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
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
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
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

        {/* Mascot — tap to open picker */}
        <div
          onClick={() => setShowPicker(true)}
          style={{ width: 220, height: 260, cursor: 'pointer', marginBottom: 24 }}
          title="Tap để đổi linh vật"
        >
          <ModelViewer mascot={mascot} cameraControls />
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

      {/* Floating bottom nav */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 8, padding: 12,
        background: 'var(--container-lowest)',
        borderRadius: 'var(--r-full)',
        boxShadow: 'var(--shadow-pink)',
        zIndex: 10,
      }}>
        {(['🏠', '☁️', '📅'] as const).map((icon, i) => (
          <div
            key={icon}
            style={{
              width: 56, height: 56,
              borderRadius: 'var(--r-full)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, cursor: 'pointer',
              background: i === 0 ? 'var(--primary-fixed)' : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            {icon}
          </div>
        ))}
      </div>

      {showPicker && (
        <MascotPicker current={mascot} onSelect={applyMascot} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/pages/EmployeeHome.tsx
git commit -m "feat(web): EmployeeHome — redesign layout matching Kawaii v3 mockup (blobs, title, bottom nav, date pill)"
```

---

### Task 11: Update AdminDashboard page

**Files:**
- Modify: `packages/web/src/pages/AdminDashboard.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { EntryTable, type EntryRow } from '../components/EntryTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { api } from '../lib/api';

const PAGE_SIZE = 20;

function subtractDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

const FILTER_CONFIG: { key: DateFilter; label: string; chipVariant: 'mint' | 'pink' | 'blue' | 'yellow' }[] = [
  { key: 'today', label: 'Hôm nay',  chipVariant: 'mint'   },
  { key: 'week',  label: '7 ngày',   chipVariant: 'pink'   },
  { key: 'month', label: '30 ngày',  chipVariant: 'blue'   },
  { key: 'all',   label: 'Tất cả',   chipVariant: 'yellow' },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [keyword, setKeyword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [error, setError] = useState<string | null>(null);

  function logout() {
    localStorage.removeItem('moodaily-token');
    navigate('/admin');
  }

  const loadEntries = useCallback(async () => {
    setError(null);
    try {
      const params: Parameters<typeof api.getEntries>[0] = { page, pageSize: PAGE_SIZE };
      if (dateFilter === 'today') params.date = new Date().toISOString().slice(0, 10);
      if (dateFilter === 'week')  params.dateFrom = subtractDays(7);
      if (dateFilter === 'month') params.dateFrom = subtractDays(30);
      if (keyword) params.keyword = keyword;
      const res = await api.getEntries(params);
      setEntries(res.items as EntryRow[]);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load entries');
    }
  }, [page, dateFilter, keyword]);

  useEffect(() => {
    if (!localStorage.getItem('moodaily-token')) { navigate('/admin'); return; }
    loadEntries();
  }, [loadEntries, navigate]);

  useEffect(() => {
    Promise.all([
      api.getEntries({ pageSize: 1, date: new Date().toISOString().slice(0, 10) }),
      api.getEntries({ pageSize: 1, dateFrom: subtractDays(7) }),
      api.getEntries({ pageSize: 1, dateFrom: subtractDays(30) }),
    ]).then(([today, week, month]) => {
      setStats({ today: today.total, week: week.total, month: month.total });
    }).catch(() => {});
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteEntry(deleteTarget);
      setDeleteTarget(null);
      loadEntries();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete entry');
      setDeleteTarget(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>

      {/* Header */}
      <header style={{
        padding: '20px var(--pad-container)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)',
      }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>
            Mood Admin
          </div>
          <div style={{ fontSize: 16, color: 'var(--on-surface-variant)', marginTop: 2 }}>
            Tổng quan cảm xúc nội bộ
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={logout}>Đăng xuất</Button>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 var(--pad-container) 40px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Hôm nay"   value={stats.today} variant="mint" />
          <StatCard label="7 ngày"    value={stats.week}  variant="pink" />
          <StatCard label="30 ngày"   value={stats.month} variant="blue" />
        </div>

        {/* Filter chips + search */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          {FILTER_CONFIG.map(f => (
            <Chip
              key={f.key}
              label={f.label}
              variant={f.chipVariant}
              onClick={() => { setDateFilter(f.key); setPage(1); }}
              style={dateFilter === f.key ? { boxShadow: '0 0 0 2px var(--primary)' } : undefined}
            />
          ))}
          <input
            placeholder="🔍 Tìm kiếm nội dung..."
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px',
              borderRadius: 'var(--r-full)',
              border: '2px solid transparent',
              background: 'var(--surface-container)',
              fontFamily: 'var(--font)', fontSize: 13,
              outline: 'none', color: 'var(--on-surface)',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-fixed-dim)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff3f3', border: '1px solid #e53935', borderRadius: 'var(--r)',
            padding: '12px 16px', color: '#c62828', fontSize: 14, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Entry table */}
        <div style={{
          background: 'var(--container-lowest)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-soft)',
          overflow: 'hidden',
        }}>
          <EntryTable entries={entries} onDelete={id => setDeleteTarget(id)} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
            <span style={{ padding: '6px 12px', color: 'var(--on-surface)', fontSize: 14 }}>
              {page} / {totalPages}
            </span>
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        message="Bạn có chắc muốn xóa entry này? Hành động không thể hoàn tác."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Final build verification — all files updated**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web build
```

Expected: Clean build, zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd e:/Working/Moodaily
git add packages/web/src/pages/AdminDashboard.tsx
git commit -m "style(web): AdminDashboard — Kawaii v3 header, mint/pink/blue stat cards and chips, new token names"
```
