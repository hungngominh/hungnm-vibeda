import { describe, it, expect } from 'vitest';
import { validateEnvValues } from './env.js';

describe('validateEnvValues', () => {
  const base = {
    DATABASE_URL: 'postgresql://localhost/test',
    JWT_SECRET: 'a'.repeat(32),
    AI_PROVIDER: 'gemini' as const,
    GEMINI_API_KEY: 'AIzaSy_test',
    OPENAI_API_KEY: '',
  };

  it('passes with valid gemini config', () => {
    const result = validateEnvValues(base);
    expect(result.AI_PROVIDER).toBe('gemini');
    expect(result.PORT).toBe(3000);
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateEnvValues({ ...base, DATABASE_URL: undefined } as any)).toThrow();
  });

  it('throws when AI_PROVIDER is invalid', () => {
    expect(() => validateEnvValues({ ...base, AI_PROVIDER: 'anthropic' } as any)).toThrow();
  });

  it('throws when AI_PROVIDER=gemini but GEMINI_API_KEY is empty', () => {
    expect(() => validateEnvValues({ ...base, GEMINI_API_KEY: '' })).toThrow();
  });

  it('throws when AI_PROVIDER=openai but OPENAI_API_KEY is empty', () => {
    expect(() => validateEnvValues({
      ...base,
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: '',
      GEMINI_API_KEY: '',
    })).toThrow();
  });
});
