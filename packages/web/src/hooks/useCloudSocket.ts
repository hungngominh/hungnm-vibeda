import { useState, useEffect, useRef } from 'react';
import type { WordItem } from '../components/WordCloud';

export function useCloudSocket(initialWords: WordItem[], isLive: boolean) {
  const [words, setWords] = useState<WordItem[]>(initialWords);
  const isLiveRef = useRef(isLive);
  useEffect(() => { isLiveRef.current = isLive; }, [isLive]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/cloud/ws`);

    ws.onmessage = (event) => {
      if (!isLiveRef.current) return;
      try {
        const msg: unknown = JSON.parse(event.data as string);
        if (
          typeof msg === 'object' && msg !== null &&
          (msg as any).type === 'cloud-update'
        ) {
          setWords((msg as any).data as WordItem[]);
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    setWords(initialWords);
  }, [initialWords]);

  return words;
}
