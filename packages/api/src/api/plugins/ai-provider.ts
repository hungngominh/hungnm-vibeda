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

const SYSTEM_PROMPT = `Trích xuất cụm từ từ câu tiếng Việt. Return JSON array ONLY, không markdown, không backtick, không giải thích.

QUY TẮC:
1. Chỉ dùng NGUYÊN VĂN từ trong câu.
2. Mỗi cụm = những từ LIỀN KỀ NHAU (không có khoảng trống giữa từ).
3. LOẠI BỎ TOÀN BỘ cụm trùng lắp: Nếu cụm A chứa trong cụm B (A là substring liên tục của B), xoá A, giữ B.
4. Nếu câu toàn vô nghĩa (aaaaa, zzzz), trả [].
5. Tối đa 6 cụm. Ưu tiên cụm dài, loại bỏ cụm con.

ALGORITHM:
- Bước 1: Tìm TẤT CẢ chuỗi 2-5 từ liền kề.
- Bước 2: XÓA BỎ mọi cụm là substring của cụm khác.
- Bước 3: Giữ tối đa 6 cụm còn lại.
- Bước 4: Return CHỈ JSON array.

VÍ DỤ:
Input: "hôm nay tôi vui vẻ và hạnh phúc"
Candidates: [hôm nay, nay tôi, tôi vui, vui vẻ, vẻ và, và hạnh, hạnh phúc, hôm nay tôi, nay tôi vui, tôi vui vẻ, vui vẻ và, vẻ và hạnh, và hạnh phúc, hôm nay tôi vui, ...]
After dedup: ["vui vẻ", "hạnh phúc"] (xoá những cụm không ý nghĩa)
Output: ["vui vẻ", "hạnh phúc"]

Input: "tui mùn dia quế cup cầu"
Candidates: [tui mùn, mùn dia, dia quế, cup cầu, tui mùn dia, mùn dia quế, dia quế cup, quế cup cầu, tui mùn dia quế, mùn dia quế cup, dia quế cup cầu, ...]
Keep meaningful: [tui mùn, mùn dia quế, cup cầu] → xoá "tui mùn" vì nó là substring của "tui mùn dia quế"
Output: ["mùn dia quế", "cup cầu"]

Input: "bữn ngủ, phải nghe nhạc thôi"
Output: ["bữn ngủ", "phải nghe nhạc", "nhạc thôi"] → Hoặc ["bữn ngủ", "phải nghe nhạc thôi"] (loại substring)`;

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
            content: `Câu gốc: ${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`VegaProxy error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as { content: Array<{ type: string; text: string }> };
    const text_content = data.content.find((c) => c.type === 'text');
    if (!text_content) return [];

    return parseClusterResponse(text_content.text);
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
