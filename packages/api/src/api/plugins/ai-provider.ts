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

const SYSTEM_PROMPT = `Trích xuất cụm từ có nghĩa từ câu tiếng Việt.

QUY TẮC TUYỆT ĐỐI:
1. CHỈ dùng NGUYÊN VĂN các từ xuất hiện trong câu gốc. KHÔNG suy diễn, KHÔNG thêm từ mới, KHÔNG đồng nghĩa hoá, KHÔNG dịch, KHÔNG diễn giải.
2. Mỗi cụm là chuỗi từ LIỀN KỀ NHAU trong câu gốc, theo đúng thứ tự.
3. KHÔNG ghép hai từ/cụm không sát nhau.
4. Mỗi cụm phải có ý nghĩa riêng (tránh cụm con lặp lại ý nghĩa của cụm lớn).
5. Tối đa 6 cụm, ưu tiên cụm dài có ý nghĩa hơn cụm ngắn lặp lại.
6. Nếu không có cụm rõ ràng hoặc chỉ là âm thanh vô nghĩa → trả [].
7. CHỈ TRẢ JSON ARRAY, không có markdown, không có giải thích, không có dấu backtick.

VÍ DỤ:
Input: "hôm nay tôi vui vẻ và hạnh phúc"
Output: ["vui vẻ", "hạnh phúc"]
(KHÔNG ["vui vẻ", "hạnh phúc", "vui"] vì "vui" là con của "vui vẻ")

Input: "buồn ngủ, phải nghe nhạc thôi"
Output: ["buồn ngủ", "phải nghe nhạc"]
(KHÔNG ["buồn ngủ", "phải nghe", "nghe nhạc", "nghe nhạc thôi"] vì chúng trùng lắp)

Input: "hiihihi"
Output: []

Input: "mệt quá đi"
Output: ["mệt quá"]`;

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
