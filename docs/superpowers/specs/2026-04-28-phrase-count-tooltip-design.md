# Phrase Count Tooltip — Design

**Date:** 2026-04-28
**Status:** Approved (awaiting implementation plan)

## Goal

Cho phép nhân viên click vào một cụm cảm xúc trong word cloud để xem cụm đó đã được chia sẻ bao nhiêu lần trong ngày, mà không phá tính ẩn danh của Moodaily.

## Non-goals

- Không hiện raw text các đoạn chứa cụm (privacy).
- Không hiện co-occurrence các cụm khác.
- Không tạo endpoint API mới — count đã có sẵn trong cloud data.
- Không thay đổi schema DB / Prisma.
- Không thay đổi admin word cloud (nếu sau này có).
- Không thêm analytics / tracking.

## UX Flow

1. Nhân viên thấy word cloud, các cụm có kích thước theo tần suất.
2. Click một cụm → tooltip nhỏ hiện ngay sát cụm đó, mũi tên chỉ vào cụm, nội dung: **"Cụm này được chia sẻ N lần"** (N highlight `var(--primary)` weight 800).
3. Đóng tooltip:
   - Click ra chỗ trống của cloud container.
   - Click lại cụm đang chọn (toggle off).
   - Nhấn ESC.
4. Click một cụm khác khi đang có tooltip → tooltip nhảy sang cụm mới, không cần đóng trước.

Hoạt động giống hệt ở [EmployeeHome](../../../packages/web/src/pages/EmployeeHome.tsx) và [WidgetPage](../../../packages/web/src/pages/WidgetPage.tsx) (cả hai cùng dùng [WordCloud](../../../packages/web/src/components/WordCloud.tsx)).

## Architecture

Logic gộp vào duy nhất [WordCloud.tsx](../../../packages/web/src/components/WordCloud.tsx). Không đụng API, không đụng parent.

### State

```ts
selected: {
  phrase: string;
  count: number;
  x: number;
  y: number;
  size: number;
} | null
```

`x, y, size` lấy thẳng từ `layoutWords` (đã có sau d3-cloud layout). `count` tra từ `words` prop theo phrase. **Không dùng** `getBoundingClientRect()` — đỡ phải tính lại khi resize. Không cần lưu `rotate` vì tooltip không xoay theo cụm (xem mục Positioning).

### Render

- Mỗi span phrase: thêm `onClick` handler (gọi `e.stopPropagation()`), đổi `cursor: 'pointer'`, hover effect: `transform: scale(1.05)` với transition 120ms.
- Khi `selected != null`: render thêm một `<div>` tooltip absolute trong cùng cloud container, với `pointer-events: none` (để click xuyên xuống cloud, đóng tooltip).
- Cloud container ngoài cùng (`<div ref={containerRef}>`): thêm `onClick` handler không điều kiện. Vì span phrase đã `stopPropagation`, click container chỉ chạy khi click vùng trống → `setSelected(null)`.

### Close behavior

- Toggle: click cụm đang chọn → `setSelected(null)`.
- Switch: click cụm khác → `setSelected(newWord)`.
- Outside: click container background → `setSelected(null)`.
- ESC: global `keydown` listener (chỉ attach khi `selected != null`).

## Positioning

### Default anchor (above)

- `left = selected.x`
- `top = selected.y - selected.size/2 - 8` (8px gap)
- `transform: translate(-50%, -100%)`
- Arrow (mũi tên ::after) hướng xuống, nhọn vào cụm.

### Rotated phrases (90deg)

- d3-cloud trả `x, y` là tâm cụm bất kể rotate → vẫn anchor đúng.
- Tooltip không xoay theo cụm. Arrow vẫn chỉ vào tâm — đủ trực quan.

### Clamp tránh tràn container

Đo container width/height từ ref. Áp dụng theo thứ tự:

1. **Top overflow:** nếu `selected.y - tooltipHeight - 8 < 0` → flip xuống dưới cụm:
   - `top = selected.y + selected.size/2 + 8`
   - `transform: translate(-50%, 0)`
   - Arrow hướng lên.
2. **Horizontal overflow:** nếu `selected.x - tooltipWidth/2 < 8` hoặc `> width - 8`:
   - Clamp `left` trong khoảng `[8, width - 8]`.
   - Arrow dịch theo phrase center thay vì tooltip center (giữ arrow chỉ đúng cụm).

## Visual style

Theo Kawaii v3 tokens hiện có:

| Property | Value |
|---|---|
| Background | `var(--container-lowest)` |
| Border-radius | `var(--r-md)` (~12px) |
| Padding | `8px 12px` |
| Box-shadow | `var(--shadow-soft)` |
| Font size | 13px |
| Font weight | 600 |
| Color | `var(--on-surface)` |
| Số đếm `N` | `var(--primary)`, weight 800 |
| Animation | scale 0.9 → 1 + fade in, ~120ms ease-out |
| Arrow size | 6px (border trick) |
| Arrow color | match background |

## Edge cases

| Case | Xử lý |
|---|---|
| Cloud rỗng | Empty state có sẵn — không cụm nào để click. Không cần thêm gì. |
| Real-time `cloud-update` qua WS | Cụm đang chọn còn trong `words` mới → cập nhật `count`. Nếu biến mất → đóng tooltip. |
| Click trùng spans gần nhau | d3-cloud không cho overlap → `event.target` luôn đúng span. |
| Đổi date trong EmployeeHome | `words` đổi → re-layout → đóng tooltip (cụm có thể không còn). |
| Widget bubble drag | Không liên quan — drag ở mascot bubble, không trong cloud. |
| `count = 1` | Vẫn hiện "Cụm này được chia sẻ 1 lần". Không cần singular/plural. |
| Widget popup constraint (cloud 160px cao) | Logic clamp đảm bảo tooltip nằm trong cloud container, không tràn popup widget (popup đã `overflow: hidden`). |

## Files affected

- [packages/web/src/components/WordCloud.tsx](../../../packages/web/src/components/WordCloud.tsx) — file duy nhất bị sửa.

## Testing

Manual test (không cần unit test mới — component thuần UI):

- [ ] Click cụm to → tooltip hiện đúng vị trí.
- [ ] Click cụm nhỏ → tooltip hiện đúng vị trí.
- [ ] Click cụm xoay 90deg → tooltip vẫn neo đúng tâm cụm.
- [ ] Click cụm sát mép trên → tooltip flip xuống dưới.
- [ ] Click cụm sát mép trái/phải → tooltip clamp, arrow vẫn chỉ đúng cụm.
- [ ] Click cụm trong widget popup (cloud 160px) → tooltip không tràn popup.
- [ ] ESC đóng tooltip.
- [ ] Click outside (vùng trống cloud) đóng tooltip.
- [ ] Click cụm đang chọn → toggle off.
- [ ] Click cụm khác khi đang có tooltip → chuyển tooltip sang cụm mới.
- [ ] Count khớp với size cụm (cụm to hơn = count lớn hơn).
- [ ] Real-time: gửi mood mới, count cập nhật trong tooltip nếu cụm đang chọn nhận thêm.
- [ ] Đổi date trong EmployeeHome → tooltip đóng.
