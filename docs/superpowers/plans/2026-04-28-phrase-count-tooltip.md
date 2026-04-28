# Phrase Count Tooltip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Click vào cụm cảm xúc trong word cloud → tooltip nhỏ neo sát cụm hiện "Cụm này được chia sẻ N lần", hoạt động ở cả EmployeeHome và Widget.

**Architecture:** Toàn bộ logic (state, click handler, tooltip render, clamp positioning, ESC listener) gộp vào duy nhất [packages/web/src/components/WordCloud.tsx](../../../packages/web/src/components/WordCloud.tsx). Không thêm component, không thêm API, không thay đổi DB. `count` đã có sẵn trong `words` prop.

**Tech Stack:** React 18, TypeScript, Vite. Word cloud render bằng d3-cloud (đã setup). Style theo Kawaii v3 CSS variables (`var(--container-lowest)`, `var(--primary)`, `var(--shadow-soft)`...).

**Spec:** [docs/superpowers/specs/2026-04-28-phrase-count-tooltip-design.md](../specs/2026-04-28-phrase-count-tooltip-design.md)

---

## Pre-flight

Trước khi bắt đầu, đọc:
- Spec: `docs/superpowers/specs/2026-04-28-phrase-count-tooltip-design.md`
- File sẽ sửa: `packages/web/src/components/WordCloud.tsx`
- Memory feedback: nếu có file `~/.claude/projects/e--Working-Moodaily/memory/feedback_*.md` liên quan FE.

**Dev workflow để manual test:**

```bash
cd e:/Working/Moodaily
pnpm --filter @moodaily/web dev
# Mở browser → http://localhost:5173 (EmployeeHome) và http://localhost:5173/widget (Widget)
```

Để có data trong cloud cho test: submit vài entry mood ở EmployeeHome trước (cần API server chạy: `pnpm --filter @moodaily/api dev`).

---

## Task 1: State + click-to-show + close behaviors

**Files:**
- Modify: `packages/web/src/components/WordCloud.tsx`

Thêm state `selected`, click handler trên span phrase (có `stopPropagation`), close khi click container background, ESC keypress đóng. Tooltip render đơn giản (chưa clamp, chưa arrow, chưa animation).

- [ ] **Step 1: Thêm state và useEffect ESC listener**

Thêm vào đầu function `WordCloud`, sau dòng `const [layoutWords, setLayoutWords] = useState<LayoutWord[]>([]);`:

```tsx
interface SelectedPhrase {
  phrase: string;
  count: number;
  x: number;
  y: number;
  size: number;
}

const [selected, setSelected] = useState<SelectedPhrase | null>(null);

useEffect(() => {
  if (!selected) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setSelected(null);
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [selected]);
```

- [ ] **Step 2: Sửa span phrase render — thêm onClick + cursor pointer**

Tìm block render span trong return:

```tsx
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
```

Đổi thành:

```tsx
{layoutWords.map(({ text, size, x, y, rotate, color }) => (
  <span
    key={text}
    onClick={(e) => {
      e.stopPropagation();
      const wordData = words.find(w => w.phrase === text);
      if (!wordData) return;
      setSelected(prev =>
        prev?.phrase === text
          ? null
          : { phrase: text, count: wordData.count, x, y, size }
      );
    }}
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
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </span>
))}
```

- [ ] **Step 3: Thêm onClick container background để đóng tooltip**

Tìm block `<div style={{ position: 'relative', height }}>`. Sửa thành:

```tsx
<div
  style={{ position: 'relative', height }}
  onClick={() => setSelected(null)}
>
```

Vì span đã `stopPropagation`, click này chỉ fire khi click vùng trống.

- [ ] **Step 4: Render tooltip cơ bản (chưa clamp, chưa arrow, chưa animation)**

Thêm sau closing `</span>` của map (vẫn trong cùng `<div style={{ position: 'relative', height }}>`):

```tsx
{selected && (
  <div
    style={{
      position: 'absolute',
      left: selected.x,
      top: selected.y - selected.size / 2 - 8,
      transform: 'translate(-50%, -100%)',
      background: 'var(--container-lowest)',
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--shadow-soft)',
      padding: '8px 12px',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--on-surface)',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 10,
    }}
  >
    Cụm này được chia sẻ{' '}
    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{selected.count}</span>{' '}
    lần
  </div>
)}
```

- [ ] **Step 5: Manual verify trong browser**

Start dev server (`pnpm --filter @moodaily/web dev`), mở `http://localhost:5173`. Đảm bảo có vài entry mood để cloud không rỗng.

Verify:
- Click cụm to → tooltip xuất hiện phía trên cụm với count đúng.
- Click cụm khác → tooltip nhảy sang cụm mới.
- Click cụm đang chọn → tooltip biến mất (toggle).
- Click vùng trống của cloud → tooltip biến mất.
- Nhấn ESC → tooltip biến mất.
- Cursor đổi thành pointer khi hover cụm.

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/components/WordCloud.tsx
git commit -m "feat(web): WordCloud — click cụm hiện tooltip count, ESC/click outside để đóng"
```

---

## Task 2: Visual polish (arrow, hover, animation)

**Files:**
- Modify: `packages/web/src/components/WordCloud.tsx`

Thêm mũi tên (arrow) trỏ vào cụm bằng border trick, hover scale trên span phrase, animation scale+fade khi tooltip xuất hiện.

- [ ] **Step 1: Thêm CSS hover + animation qua injected stylesheet**

Thêm hằng ở **module level** (ngoài function component, sau imports và sau `const WORD_COLORS = ...`):

```tsx
const STYLE_SHEET = `
.word-cloud-phrase { transition: transform 120ms ease-out; }
.word-cloud-phrase:hover { transform: translate(-50%, -50%) scale(1.05) rotate(var(--rotate, 0deg)) !important; }
.word-cloud-tooltip { animation: word-cloud-tooltip-in 120ms ease-out; }
@keyframes word-cloud-tooltip-in {
  from { opacity: 0; transform: translate(-50%, -100%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
}
`;
```

Inject style một lần qua useEffect (đặt trong function component, sau khai báo state):

```tsx
useEffect(() => {
  if (document.getElementById('word-cloud-styles')) return;
  const s = document.createElement('style');
  s.id = 'word-cloud-styles';
  s.textContent = STYLE_SHEET;
  document.head.appendChild(s);
}, []);
```

Lưu ý: `!important` trên `.word-cloud-phrase:hover` cần thiết để override inline `transform` của span (React inline style mặc định thắng CSS class).

- [ ] **Step 2: Thêm className lên span phrase và tooltip, set CSS var --rotate**

Sửa span phrase (Task 1 step 2 đã edit, sửa thêm):

```tsx
<span
  key={text}
  className="word-cloud-phrase"
  onClick={...}
  style={{
    ...,
    ['--rotate' as any]: `${rotate}deg`,
    transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
    ...
  }}
>
```

Sửa tooltip div (Task 1 step 4):

```tsx
<div
  className="word-cloud-tooltip"
  style={{ ...existing... }}
>
```

- [ ] **Step 3: Thêm arrow ở dưới tooltip**

Thay block tooltip render bằng version có arrow:

```tsx
{selected && (
  <div
    className="word-cloud-tooltip"
    style={{
      position: 'absolute',
      left: selected.x,
      top: selected.y - selected.size / 2 - 8,
      transform: 'translate(-50%, -100%)',
      background: 'var(--container-lowest)',
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--shadow-soft)',
      padding: '8px 12px',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--on-surface)',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 10,
    }}
  >
    Cụm này được chia sẻ{' '}
    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{selected.count}</span>{' '}
    lần
    <span
      style={{
        position: 'absolute',
        left: '50%',
        bottom: -6,
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid var(--container-lowest)',
        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.06))',
      }}
    />
  </div>
)}
```

- [ ] **Step 4: Manual verify visual polish**

- Hover cụm → cụm scale 1.05 mượt.
- Click cụm → tooltip xuất hiện với scale+fade animation.
- Tooltip có mũi tên nhọn chỉ xuống cụm.
- Mũi tên có shadow nhẹ liền với tooltip.

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/WordCloud.tsx
git commit -m "feat(web): WordCloud tooltip — arrow, hover scale, fade-in animation"
```

---

## Task 3: Clamp positioning (top flip, horizontal clamp)

**Files:**
- Modify: `packages/web/src/components/WordCloud.tsx`

Đo kích thước tooltip sau khi render, áp dụng flip xuống dưới khi sát top, clamp horizontal khi sát mép trái/phải, dịch arrow theo phrase center.

- [ ] **Step 1: Thêm tooltipRef và state đo dimensions**

Thêm ref và state sau `const [selected, setSelected] = useState<SelectedPhrase | null>(null);`:

```tsx
const tooltipRef = useRef<HTMLDivElement>(null);
const [tooltipBox, setTooltipBox] = useState<{ w: number; h: number } | null>(null);

useEffect(() => {
  if (!selected || !tooltipRef.current) {
    setTooltipBox(null);
    return;
  }
  const el = tooltipRef.current;
  setTooltipBox({ w: el.offsetWidth, h: el.offsetHeight });
}, [selected]);
```

- [ ] **Step 2: Tính toán position và arrow offset**

Thêm trước block render tooltip:

```tsx
const containerW = containerRef.current?.offsetWidth ?? 0;
const tooltipPos = (() => {
  if (!selected) return null;
  const w = tooltipBox?.w ?? 200; // fallback ước lượng
  const h = tooltipBox?.h ?? 36;

  // Vertical: default above, flip xuống nếu sát top
  const aboveTop = selected.y - selected.size / 2 - 8 - h;
  const flipDown = aboveTop < 8;
  const top = flipDown
    ? selected.y + selected.size / 2 + 8
    : selected.y - selected.size / 2 - 8;
  const transformY = flipDown ? '0' : '-100%';

  // Horizontal: clamp trong [8, containerW - 8 - w]
  const idealLeft = selected.x - w / 2;
  const clampedLeft = Math.max(8, Math.min(containerW - 8 - w, idealLeft));
  const left = clampedLeft + w / 2; // back to center coords
  const arrowOffsetPx = selected.x - clampedLeft; // arrow px từ left của tooltip

  return { top, left, transformY, flipDown, arrowOffsetPx, w };
})();
```

- [ ] **Step 3: Áp dụng position + arrow direction vào tooltip render**

Thay block tooltip (Task 2 step 3) bằng version dùng `tooltipPos`:

```tsx
{selected && tooltipPos && (
  <div
    ref={tooltipRef}
    className="word-cloud-tooltip"
    style={{
      position: 'absolute',
      left: tooltipPos.left,
      top: tooltipPos.top,
      transform: `translate(-50%, ${tooltipPos.transformY})`,
      background: 'var(--container-lowest)',
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--shadow-soft)',
      padding: '8px 12px',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--on-surface)',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 10,
    }}
  >
    Cụm này được chia sẻ{' '}
    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{selected.count}</span>{' '}
    lần
    <span
      style={{
        position: 'absolute',
        left: tooltipPos.arrowOffsetPx,
        ...(tooltipPos.flipDown
          ? {
              top: -6,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid var(--container-lowest)',
            }
          : {
              bottom: -6,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--container-lowest)',
            }),
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.06))',
      }}
    />
  </div>
)}
```

- [ ] **Step 4: Manual verify edge cases**

- Cụm gần mép trên cloud → tooltip flip xuống dưới, arrow chỉ lên.
- Cụm gần mép trái → tooltip không tràn, arrow vẫn chỉ đúng tâm cụm.
- Cụm gần mép phải → tooltip không tràn, arrow vẫn chỉ đúng tâm cụm.
- Cụm xoay 90deg → tooltip vẫn neo đúng tâm cụm.
- Test trong Widget popup (`http://localhost:5173/widget`) — cloud chỉ 160px cao, popup chỉ 240px rộng → tooltip vẫn nằm gọn trong cloud container.

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/WordCloud.tsx
git commit -m "feat(web): WordCloud tooltip — clamp top/horizontal, arrow follows phrase center"
```

---

## Task 4: Real-time sync khi `words` thay đổi

**Files:**
- Modify: `packages/web/src/components/WordCloud.tsx`

Khi `words` prop đổi (do WS `cloud-update` hoặc đổi date trong EmployeeHome), cập nhật count trong tooltip nếu cụm vẫn còn, hoặc đóng tooltip nếu cụm đã bị xóa.

- [ ] **Step 1: Thêm effect sync `selected` khi `words` đổi**

Thêm sau effect ESC listener (Task 1 step 1). Dùng functional setState để không cần `selected` trong deps (tránh stale closure và infinite loop):

```tsx
useEffect(() => {
  setSelected(prev => {
    if (!prev) return prev;
    const current = words.find(w => w.phrase === prev.phrase);
    if (!current) return null; // cụm đã biến mất → đóng
    if (current.count === prev.count) return prev; // không đổi → giữ reference cũ
    return { ...prev, count: current.count }; // cập nhật count mới
  });
}, [words]);
```

- [ ] **Step 2: Thêm effect sync `{x, y, size}` khi `layoutWords` đổi (resize / re-layout)**

Thêm sau effect step 1. Cùng pattern functional setState:

```tsx
useEffect(() => {
  setSelected(prev => {
    if (!prev) return prev;
    const current = layoutWords.find(lw => lw.text === prev.phrase);
    if (!current) return null;
    if (current.x === prev.x && current.y === prev.y && current.size === prev.size) return prev;
    return { ...prev, x: current.x, y: current.y, size: current.size };
  });
}, [layoutWords]);
```

- [ ] **Step 3: Manual verify real-time**

Mở 2 tab trên `http://localhost:5173`:
- Tab A: click một cụm có count thấp (ví dụ "vui vẻ" count 1) → tooltip "Cụm này được chia sẻ 1 lần".
- Tab B: submit mood mới chứa cụm "vui vẻ".
- Tab A: tooltip cập nhật "Cụm này được chia sẻ 2 lần" (qua WS).

Test đổi date:
- Click cụm, đợi tooltip hiện.
- Click nút `←` để chuyển sang ngày trước.
- Tooltip phải đóng (vì cụm có thể không còn ở ngày khác).

Test resize:
- Click cụm, đợi tooltip hiện.
- Resize browser window (hoặc devtools mobile mode).
- Cloud re-layout → tooltip phải bám theo cụm tại vị trí mới hoặc đóng nếu cụm bị reflow tới chỗ rất khác.

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/components/WordCloud.tsx
git commit -m "feat(web): WordCloud tooltip — sync count/position khi words/layout đổi"
```

---

## Final verification

Sau khi hoàn thành 4 tasks, chạy full manual test theo checklist trong [spec section "Testing"](../specs/2026-04-28-phrase-count-tooltip-design.md#testing):

- [ ] Click cụm to → tooltip hiện đúng vị trí.
- [ ] Click cụm nhỏ → tooltip hiện đúng vị trí.
- [ ] Click cụm xoay 90deg → tooltip vẫn neo đúng tâm cụm.
- [ ] Click cụm sát mép trên → tooltip flip xuống dưới.
- [ ] Click cụm sát mép trái/phải → tooltip clamp, arrow vẫn chỉ đúng cụm.
- [ ] Click cụm trong widget popup → tooltip không tràn popup.
- [ ] ESC đóng tooltip.
- [ ] Click outside (vùng trống cloud) đóng tooltip.
- [ ] Click cụm đang chọn → toggle off.
- [ ] Click cụm khác khi đang có tooltip → chuyển tooltip sang cụm mới.
- [ ] Count khớp với size cụm.
- [ ] Real-time: gửi mood mới, count cập nhật trong tooltip nếu cụm đang chọn nhận thêm.
- [ ] Đổi date trong EmployeeHome → tooltip đóng.

**Build check:**

```bash
pnpm --filter @moodaily/web build
```

Phải pass tsc + vite build không lỗi.

**Final commit (nếu có fixup):** chỉ commit khi build/manual test có vấn đề cần sửa.
