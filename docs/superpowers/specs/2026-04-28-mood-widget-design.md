# Moodaily — Mood Widget Design Spec
_2026-04-28_

## Overview

Widget nhúng được (embeddable) hiển thị mascot nhỏ cố định góc dưới-phải màn hình. Bấm vào mascot → popup card mở ra với mood input và word cloud realtime. Widget chạy tại route `/widget`, có thể nhúng vào bất kỳ trang nội bộ nào qua `<iframe>`.

---

## 1. Route & Page

- Route mới: `/widget` → component `WidgetPage.tsx`
- Background của page: `transparent` — iframe trong suốt, không che nội dung trang cha
- App.tsx thêm route `/widget` → `<WidgetPage />`

**Nhúng vào EmployeeHome (test):**
```html
<iframe
  src="/widget"
  style="position:fixed;inset:0;width:100%;height:100%;border:none;z-index:100;background:transparent"
  allowtransparency="true"
/>
```

**Click-through qua iframe:** `pointer-events: none` đặt bên **trong** WidgetPage trên `html` và `body`. Chỉ widget elements có `pointer-events: auto`. Clicks vào vùng trống của iframe xuyên xuống trang cha; clicks vào bubble/popup được xử lý bình thường.

```css
/* Trong WidgetPage — global style */
html, body { pointer-events: none; background: transparent; }
/* Trên container widget */
.widget-root { pointer-events: auto; }
```

---

## 2. Cấu trúc Component

```
WidgetPage
├── MascotBubble (button collapsed, fixed bottom-right)
└── WidgetPopup (card nổi phía trên bubble, khi isOpen=true)
    ├── PopupHeader
    │   ├── mascot emoji (nhỏ, 36×36)
    │   ├── tiêu đề "Hôm nay bạn thế nào?"
    │   └── nút "🎭 Đổi" → mở MascotPicker modal
    ├── MoodInput (reuse)        ← packages/web/src/components/MoodInput.tsx
    └── WordCloud (reuse, thu nhỏ)  ← packages/web/src/components/WordCloud.tsx
```

**Files mới:**
- `packages/web/src/pages/WidgetPage.tsx` — page chứa toàn bộ widget logic

Không tách thêm file component riêng vì widget đủ nhỏ để tự chứa.

---

## 3. Trạng thái

### Collapsed
- Mascot bubble: `position: fixed`, `bottom: 20px`, `right: 20px`
- Kích thước: 62×62px, border-radius 50%, background `var(--primary)`
- Hiển thị emoji của mascot đang chọn (không dùng GLB model — nhẹ hơn)
- Bấm → `isOpen = true`

### Expanded (popup open)
- Popup card: `position: fixed`, `bottom: 92px`, `right: 14px`, width `240px`
- Border-radius 18px, box-shadow
- Animation: scale từ 0.8 → 1 + fade in (CSS transition)
- Bấm ngoài vùng popup → `isOpen = false`
- Popup card có mũi tên nhỏ chỉ xuống bubble

---

## 4. Popup Content

### Header
- Avatar mascot nhỏ (emoji, white background circle)
- Text: **"Hôm nay bạn thế nào?"** / sub: "Chia sẻ ẩn danh"
- Nút **"🎭 Đổi"** → mở `<MascotPicker>` (modal, reuse component sẵn)

### Mood Input
- Reuse `<MoodInput>` với `onSubmit={async (text) => api.submitMood(text)}`
- Sau submit: hiện toast nhỏ "Đã gửi ✓", clear input

### Word Cloud
- Reuse `<WordCloud words={words} height={160} />`
- `words` từ `useCloudSocket(initialWords, true)` — load ngay khi popup mở
- WordCloud cần thêm optional prop `height?: number` (default 320) — thay thế hằng số `CLOUD_HEIGHT` nội bộ

---

## 5. Mascot

- Key: đọc/lưu `localStorage['moodaily-mascot']` (cùng key với EmployeeHome)
- Vì iframe cùng origin (`same-origin`) nên share được localStorage với trang cha
- Emoji map:
  ```
  chick      → 🐥
  axolotl    → 🦎
  mocha_cat  → 🐱
  whale      → 🐳
  ```
- Khi `MascotPicker` đổi mascot: cập nhật state + localStorage + `document.documentElement.dataset.theme`

---

## 6. Dữ liệu

- `api.submitMood(text)` — POST `/api/mood/submit` (public, không cần auth)
- `api.getCloud(date)` — GET `/api/cloud?date=...` — load lần đầu
- `useCloudSocket(initialWords, true)` — WebSocket `/api/cloud/ws` để realtime

---

## 7. Không thay đổi

- API backend: không thêm endpoint mới
- EmployeeHome: chỉ thêm `<iframe>` để test, không thay đổi logic
- WordCloud, MoodInput, MascotPicker, useCloudSocket, api: không sửa — chỉ reuse
