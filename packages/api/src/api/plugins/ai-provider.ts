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

const SYSTEM_PROMPT = `Extract meaningful phrase clusters from Vietnamese text.

RULES:
1. Use EXACT words from input only. Never infer, add, or paraphrase words.
2. Each cluster = 2-5 adjacent words (no gaps, no punctuation between words).
3. Remove overlapping clusters: if "a b c" and "b c" both extracted, keep only "a b c".
4. If input is pure nonsense (aaaaa, zzzz, random gibberish), return [].
5. Target 2-4 clusters. Avoid including single-word or very short (1-2 word) trivial phrases.
6. Punctuation (comma, period) acts as a boundary - don't include punctuation marks in clusters.

OUTPUT: Return ONLY a JSON array. NO markdown, NO backticks, NO explanation, NO other text.
CORRECT examples: ["chi muốn", "trânh nóng"]  or  ["buồn ngủ", "phải nghe nhạc"]  or  []
WRONG: \`\`\`json [...]\`\`\`  or  [...] plus explanation text.`;

class OpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async extractClusters(text: string): Promise<string[]> {
    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: `${SYSTEM_PROMPT}\n\nCâu gốc: ${text}` },
      ],
    });
    return parseClusterResponse(res.choices[0]?.message?.content ?? '[]');
  }
}

class GeminiProvider implements AiProvider {
  private genModel: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.genModel = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
        maxOutputTokens: 200,
      },
    });
  }

  async extractClusters(text: string): Promise<string[]> {
    const result = await this.genModel.generateContent(
      `${SYSTEM_PROMPT}\n\nCâu gốc: ${text}`
    );
    return parseClusterResponse(result.response.text());
  }
}

class VegaProxyProvider implements AiProvider {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string = 'https://claudinge.allianceitsc.com') {
    this.apiKey = apiKey;
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  async extractClusters(text: string): Promise<string[]> {
    const response = await fetch(`${this.endpoint}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20241022',
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Text: ${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      throw new Error(`VegaProxy error ${response.status}: ${response.statusText} - ${errorBody}`);
    }

    const data = (await response.json()) as { content: Array<{ type: string; text: string }> };
    const text_content = data.content.find((c) => c.type === 'text');
    if (!text_content) {
      console.warn('[VegaProxy] No text content in response:', data);
      return [];
    }

    const clusters = parseClusterResponse(text_content.text);
    if (clusters.length === 0) {
      console.debug('[VegaProxy] No clusters extracted from text:', text);
    }
    return clusters;
  }
}

class AzureOpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string, endpoint: string, deploymentName: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}`,
      defaultQuery: { 'api-version': '2024-02-15-preview' },
      defaultHeaders: { 'api-key': apiKey },
    });
  }

  async extractClusters(text: string): Promise<string[]> {
    const res = await this.client.chat.completions.create({
      model: 'deployment-name',
      messages: [
        { role: 'user', content: `${SYSTEM_PROMPT}\n\nCâu gốc: ${text}` },
      ],
    });
    return parseClusterResponse(res.choices[0]?.message?.content ?? '[]');
  }
}

export function createAiProvider(): AiProvider {
  const provider = env.AI_PROVIDER?.toLowerCase() || 'gemini';

  switch (provider) {
    case 'openai':
      return new OpenAiProvider(env.OPENAI_API_KEY);
    case 'vegaproxy':
      return new VegaProxyProvider(env.VEGAPROXY_API_KEY, env.VEGAPROXY_ENDPOINT);
    case 'azure':
      return new AzureOpenAiProvider(
        env.AZURE_OPENAI_API_KEY,
        env.AZURE_OPENAI_ENDPOINT,
        env.AZURE_OPENAI_DEPLOYMENT
      );
    case 'gemini':
    default:
      return new GeminiProvider(env.GEMINI_API_KEY);
  }
}
