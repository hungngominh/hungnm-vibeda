export interface WordItem {
  phrase: string;
  count: number;
}

interface WordCloudProps {
  words: WordItem[];
}

export function WordCloud({ words }: WordCloudProps) {
  if (words.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: 15 }}>
        Chưa có cảm xúc nào được chia sẻ hôm nay
      </div>
    );
  }

  const maxCount = Math.max(...words.map(w => w.count));
  const minCount = Math.min(...words.map(w => w.count));

  function fontSize(count: number): number {
    if (maxCount === minCount) return 28;
    return Math.round(16 + ((count - minCount) / (maxCount - minCount)) * 32);
  }

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '10px 18px',
      justifyContent: 'center', alignItems: 'center', padding: '24px 0',
    }}>
      {words.map(({ phrase, count }) => (
        <span
          key={phrase}
          title={`${count} lần`}
          style={{
            fontSize: fontSize(count),
            fontWeight: 600,
            color: 'var(--primary)',
            opacity: 0.55 + (count / maxCount) * 0.45,
            transition: 'font-size 0.3s ease',
            cursor: 'default',
          }}
        >
          {phrase}
        </span>
      ))}
    </div>
  );
}
