import { describe, it, expect } from 'vitest';

// Mirror the parsing logic to test independently (no real API calls)
function parseClusterResponse(raw: string): string[] {
  const clean = raw.replace(/^```json\s*/m, '').replace(/\s*```\s*$/, '').trim();
  const parsed: unknown = JSON.parse(clean);
  if (Array.isArray(parsed)) return parsed as string[];
  if (typeof parsed === 'object' && parsed !== null) {
    for (const v of Object.values(parsed as Record<string, unknown>)) {
      if (Array.isArray(v)) return v as string[];
    }
  }
  return [];
}

describe('parseClusterResponse', () => {
  it('parses a plain JSON array', () => {
    expect(parseClusterResponse('["vui vẻ","hạnh phúc"]')).toEqual(['vui vẻ', 'hạnh phúc']);
  });

  it('strips markdown code block before parsing', () => {
    expect(parseClusterResponse('```json\n["buồn bã"]\n```')).toEqual(['buồn bã']);
  });

  it('extracts array from object response', () => {
    expect(parseClusterResponse('{"clusters":["lo lắng","mệt mỏi"]}')).toEqual(['lo lắng', 'mệt mỏi']);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseClusterResponse('not json')).toThrow();
  });
});
