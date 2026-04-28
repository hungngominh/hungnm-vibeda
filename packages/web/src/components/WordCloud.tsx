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

interface SelectedPhrase {
  phrase: string;
  count: number;
  x: number;
  y: number;
  size: number;
}

interface WordCloudProps {
  words: WordItem[];
  height?: number;
}

export function WordCloud({ words, height = 320 }: WordCloudProps) {
  const [layoutWords, setLayoutWords] = useState<LayoutWord[]>([]);
  const [selected, setSelected] = useState<SelectedPhrase | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipBox, setTooltipBox] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected || !tooltipRef.current) {
      setTooltipBox(null);
      return;
    }
    const el = tooltipRef.current;
    setTooltipBox({ w: el.offsetWidth, h: el.offsetHeight });
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  useEffect(() => {
    setSelected(prev => {
      if (!prev) return prev;
      const current = words.find(w => w.phrase === prev.phrase);
      if (!current) return null; // cụm đã biến mất → đóng
      if (current.count === prev.count) return prev; // không đổi → giữ reference cũ
      return { ...prev, count: current.count }; // cập nhật count mới
    });
  }, [words]);

  useEffect(() => {
    setSelected(prev => {
      if (!prev) return prev;
      const current = layoutWords.find(lw => lw.text === prev.phrase);
      if (!current) return null;
      if (current.x === prev.x && current.y === prev.y && current.size === prev.size) return prev;
      return { ...prev, x: current.x, y: current.y, size: current.size };
    });
  }, [layoutWords]);

  useEffect(() => {
    if (!words.length) {
      setLayoutWords([]);
      return;
    }

    const compact = height < 200;
    const baseSize = compact ? 9 : 13;
    const rangeSize = compact ? 9 : 24;
    const equalSize = compact ? 13 : 24;
    const padding = compact ? 3 : 10;

    const maxCount = Math.max(...words.map(w => w.count));
    const minCount = Math.min(...words.map(w => w.count));
    const sizeScale = (count: number) =>
      maxCount === minCount ? equalSize : Math.round(baseSize + ((count - minCount) / (maxCount - minCount)) * rangeSize);

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
      .padding(padding)
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

  const containerW = containerRef.current?.offsetWidth ?? 0;
  const tooltipPos = (() => {
    if (!selected) return null;
    const w = tooltipBox?.w ?? 200; // ước lượng cho lần render đầu trước khi đo được
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
    const maxLeft = Math.max(8, containerW - 8 - w);
    const clampedLeft = Math.max(8, Math.min(maxLeft, idealLeft));
    const left = clampedLeft + w / 2; // back to center coords (sẽ apply translate(-50%, ...))
    const arrowOffsetPx = selected.x - clampedLeft; // arrow distance từ left edge của tooltip

    return { top, left, transformY, flipDown, arrowOffsetPx };
  })();

  return (
    <div
      ref={containerRef}
      style={{
        background: 'var(--container-lowest)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-soft)',
        padding: height < 200 ? '16px 12px' : '36px 20px',
        minHeight: height + (height < 200 ? 32 : 72),
        position: 'relative',
        overflow: 'hidden',
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
        <div
          style={{ position: 'relative', height }}
          onClick={() => setSelected(null)}
        >
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
          {selected && tooltipPos && (
            <div
              ref={tooltipRef}
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
        </div>
      )}
    </div>
  );
}
