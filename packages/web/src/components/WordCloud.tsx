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

    (cloud as any)()
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
      .fontSize((d: D3Word) => d.size ?? 16)
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
