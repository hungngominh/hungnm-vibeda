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
