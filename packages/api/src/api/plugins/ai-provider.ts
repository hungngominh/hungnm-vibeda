import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../env.js';

export interface AiProvider {
  extractClusters(text: string): Promise<string[]>;
}

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

const PROMPT = (text: string) =>
  `Trích xuất tối đa 6 cụm cảm xúc ngắn (2–5 từ) từ câu tiếng Việt sau, trả JSON array thuần (không markdown): ${text}`;

class OpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async extractClusters(text: string): Promise<string[]> {
    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: PROMPT(text) }],
    });
    return parseClusterResponse(res.choices[0]?.message?.content ?? '[]');
  }
}

class GeminiProvider implements AiProvider {
  private genModel: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.genModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async extractClusters(text: string): Promise<string[]> {
    const result = await this.genModel.generateContent(PROMPT(text));
    return parseClusterResponse(result.response.text());
  }
}

export function createAiProvider(): AiProvider {
  if (env.AI_PROVIDER === 'openai') return new OpenAiProvider(env.OPENAI_API_KEY);
  return new GeminiProvider(env.GEMINI_API_KEY);
}
