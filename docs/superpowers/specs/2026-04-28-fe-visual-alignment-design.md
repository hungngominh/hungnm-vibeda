# FE Visual Alignment — Design Spec
**Date:** 2026-04-28
**Status:** Approved

## Goal

Align the React frontend (`packages/web/`) with the approved `design-preview.html` (Kawaii Design System v3). The FE currently uses a simplified CSS variable set and inline styles that don't match the Material 3 token names, layout, or visual weight of the design preview.

## Scope

- All screens: EmployeeHome (`/`), AdminDashboard (`/admin/dashboard`)
- Full token system refactor (`themes.css`)
- No new pages or routes

## Approach

Token-first + keep inline styles pattern. Update `themes.css` with the full Material 3 token set, then update each component and page to use the correct tokens and match the design layout.

---

## Section 1: Token System (`themes.css`)

### Rename existing variables

| Old name | New name |
|---|---|
| `--text` | `--on-surface` |
| `--text-secondary` | `--on-surface-variant` |
| `--border` | `--outline-variant` |
| `--radius` | `--r-lg` (16px) |
| `--radius-sm` | `--r-sm` (8px) |
| `--shadow` | `--shadow-soft` |

### Add new tokens (all 4 themes)

**Surfaces:**
- `--surface-container` — input/textarea background (slightly darker than surface)
- `--container-lowest` — pure white card background

**Text:**
- `--on-surface` — primary text (replaces `--text`)
- `--on-surface-variant` — secondary text (replaces `--text-secondary`)
- `--outline` — visible border (stronger than `--outline-variant`)

**Primary fixed (mint light):**
- `--primary-fixed` — chip/nav-active background
- `--primary-fixed-dim` — focus border color
- `--on-primary` — text on solid primary button (`#ffffff`)

**Secondary fixed (pink light):**
- `--secondary-fixed` — pink chip background
- `--secondary-fixed-dim` — pink focus/accent
- `--on-secondary` — text on solid secondary (`#ffffff`)

**Tertiary (blue accent — new for all themes):**
- `--tertiary` — solid blue
- `--tertiary-container` — blue container
- `--tertiary-fixed` — blue chip background
- `--on-tertiary` — text on solid tertiary (`#ffffff`)
- `--on-tertiary-container` — text on tertiary container

**Shadows (tinted):**
- `--shadow-soft` — neutral soft shadow
- `--shadow-mint` — mint-tinted shadow (primary action cards)
- `--shadow-pink` — pink-tinted shadow (secondary cards, bottom nav)

**Radius scale:**
- `--r-sm: 0.5rem` (8px)
- `--r: 1rem` (16px)
- `--r-md: 1.5rem` (24px)
- `--r-lg: 2rem` (32px) — cards
- `--r-xl: 3rem` (48px) — page containers
- `--r-full: 9999px` — pills/buttons

**Spacing:**
- `--pad-container: 24px`
- `--stack-sm: 12px`
- `--stack-md: 20px`

### Theme color values

**chick (default)** — matches design-preview exactly:
- surface: `#fff9ea`, surface-container: `#faefb8`, container-lowest: `#ffffff`
- primary: `#006b55`, primary-container: `#87dcc0`, primary-fixed: `#9ef3d6`, primary-fixed-dim: `#82d7bb`
- on-primary-container: `#00624d`, on-primary: `#ffffff`
- secondary: `#864d61`, secondary-container: `#fdb5cc`, secondary-fixed: `#ffd9e3`, secondary-fixed-dim: `#fab3ca`
- on-secondary-container: `#7a4357`, on-secondary: `#ffffff`
- tertiary: `#30628a`, tertiary-container: `#a1d1fe`, tertiary-fixed: `#cde5ff`
- on-tertiary: `#ffffff`, on-tertiary-container: `#265a81`
- on-surface: `#201c00`, on-surface-variant: `#3e4945`
- outline: `#6e7a74`, outline-variant: `#bec9c3`
- shadow-soft: `0 4px 18px rgba(134,77,97,0.08)`
- shadow-mint: `0 8px 24px rgba(0,107,85,0.15)`
- shadow-pink: `0 8px 24px rgba(134,77,97,0.15)`

**axolotl, mocha, whale** — keep existing hue palette, add tertiary (cool blue variant per theme) and all missing tokens following the same pattern.

---

## Section 2: EmployeeHome (`EmployeeHome.tsx`)

### Layout

Full-page centered single column. No top header bar. Outer wrapper: `position: relative`, `overflow: hidden`, `min-height: 100vh`.

**Decorative blobs** (absolute positioned, `pointer-events: none`, `z-index: 0`):
- Top-right: radial gradient circle, pink tinted (`rgba(secondary-fixed-dim, 0.30)`)
- Bottom-left: radial gradient circle, mint tinted (`rgba(primary-fixed, 0.28)`)

**Content** (`z-index: 1`, relative, max-width 720px, centered):
1. `model-viewer` — 220×260px, centered, tap to open MascotPicker
2. Title — "Hôm nay của bạn thế nào?" — 32px, 800 weight, `--on-surface`
3. Subtitle — "Chia sẻ ẩn danh — từng cụm cảm xúc sẽ bay vào mây bên dưới" — 16px, 500 weight, `--on-surface-variant`
4. `MoodInput` — max-width 540px, centered
5. Cloud section (see below)
6. Floating bottom nav

### Mascot picker trigger
Tap/click on the `model-viewer` element opens `MascotPicker`. Remove the old 🎨 header button.

### Cloud section header
Row with two items, space-between:
- Left: `☁️ MÂY CẢM XÚC CỦA CẢ NHÀ` — 12px, 700, uppercase, `--on-surface-variant`
- Right: date pill — `← {label} →` with calendar emoji prefix — `background: container-lowest`, `border-radius: r-full`, `box-shadow: shadow-soft`. Contains inline ← / → buttons that shift the date by ±1 day. Center label shows "Hôm nay" or the date string. Replaces the current standalone arrow buttons.

### Floating bottom nav
Pill container: `background: container-lowest`, `border-radius: r-full`, `box-shadow: shadow-pink`, `width: fit-content`, centered, `margin: 24px auto 0`.

Items: 56×56px circles. Active (🏠): `background: primary-fixed`. Others hover: `background: surface-container`.

3 items: 🏠 (home, always active on this page), ☁️ (no-op for now), 📅 (no-op for now).

---

## Section 3: Components

### Button (`Button.tsx`)

- `border-radius: var(--r-full)` (pill) — replaces `--r-sm`
- Padding md: `14px 32px`, sm: `6px 14px`
- `primary` variant: `background: var(--primary-container)`, `color: var(--on-primary-container)`, `box-shadow: var(--shadow-mint)`
- `secondary` variant: `background: var(--secondary-container)`, `color: var(--on-secondary-container)`, `box-shadow: var(--shadow-pink)`
- `ghost` and `danger`: unchanged
- Hover: `transform: translateY(-2px)`, active: `scale(0.95)`

### MoodInput (`MoodInput.tsx`)

Textarea:
- `background: var(--container-lowest)`
- `border: 2px solid transparent`
- `box-shadow: var(--shadow-soft)`
- Focus: `border-color: var(--primary-fixed-dim)`, `background: var(--container-lowest)`
- `border-radius: var(--r-md)`
- Container max-width 540px, `margin: 0 auto`

### WordCloud (`WordCloud.tsx`)

Replace current flex-wrap implementation with `react-wordcloud` library (wraps `d3-cloud`):
- Install: `react-wordcloud` (or `d3-cloud` + manual integration if react-wordcloud has React 18 issues)
- Words rotate: mix of 0° and 90°
- Word colors: cycle through `--primary` (mint), `--secondary` (pink), `--tertiary` (blue) — assign by word index or frequency bucket
- Font: `Plus Jakarta Sans`, weight 800
- Size range: 16–48px (scaled by count)

Card container wrapping the cloud:
- `background: var(--container-lowest)`
- `border-radius: var(--r-lg)`
- `box-shadow: var(--shadow-soft)`
- `min-height: 240px`
- `padding: 36px 20px`

Empty state: centered text, `--on-surface-variant`, inside the card.

### Chip (`Chip.tsx`)

Add `variant` prop: `'mint' | 'pink' | 'blue' | 'yellow'` (default `'mint'`).

| Variant | bg token | text token |
|---|---|---|
| mint | `--primary-fixed` | `--on-primary-container` |
| pink | `--secondary-fixed` | `--on-secondary-container` |
| blue | `--tertiary-fixed` | `--on-tertiary-container` |
| yellow | `--surface-container` | `--on-surface` |

Shape: `border-radius: var(--r-full)`, `padding: 8px 16px`, `font-size: 12px`, `font-weight: 700`, uppercase, `letter-spacing: 0.04em`.

### StatCard (`StatCard.tsx`)

Add `variant` prop: `'mint' | 'pink' | 'blue'`.

| Variant | bg token | text token |
|---|---|---|
| mint | `--primary-fixed` | `--on-primary-container` |
| pink | `--secondary-fixed` | `--on-secondary-container` |
| blue | `--tertiary-fixed` | `--on-tertiary-container` |

---

## Section 4: Admin screens (`AdminDashboard.tsx`)

### Header
- `background: var(--surface)` (no border-bottom, no white background)
- Title "Mood Admin": `font-size: 24px`, `font-weight: 700`, `--on-surface`
- Subtitle "Tổng quan cảm xúc nội bộ": `font-size: 16px`, `--on-surface-variant`
- Logout button: `variant="secondary"` (pill, pink shadow)

### Stat cards
- "Hôm nay" → `variant="mint"`, "7 ngày" → `variant="pink"`, "30 ngày" → `variant="blue"`

### Filter chips
- "Hôm nay" → `variant="mint"`, "7 ngày" → `variant="pink"`, "30 ngày" → `variant="blue"`, "Tất cả" → `variant="yellow"`
- Active state: add `box-shadow: 0 0 0 2px var(--primary)` instead of overriding background to dark primary (outline looks bad on pill shapes)

### Search input
- `background: var(--surface-container)`
- `border: 2px solid transparent`
- Focus: `border-color: var(--primary-fixed-dim)`
- `border-radius: var(--r-full)` (pill)

### Entry table wrapper
- `background: var(--container-lowest)`
- `border-radius: var(--r-lg)`
- `box-shadow: var(--shadow-soft)`
- Remove `border: 1px solid var(--border)`

### Delete button (in table rows)
- `variant="secondary"` size `sm` on Button component

---

## Out of scope
- New pages (cloud tab, calendar tab behind bottom nav icons)
- Backend changes
- MascotPicker visual redesign
- AdminLogin page redesign
