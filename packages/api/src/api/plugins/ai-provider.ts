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
  `Nhiệm vụ: Trích xuất tối đa 6 cụm cảm xúc ngắn (1–5 từ) từ câu tiếng Việt dưới đây.

QUY TẮC BẮT BUỘC:
1. CHỈ dùng NGUYÊN VĂN các từ xuất hiện trong câu gốc. TUYỆT ĐỐI KHÔNG suy diễn, KHÔNG thêm từ mới, KHÔNG đồng nghĩa hoá, KHÔNG dịch, KHÔNG diễn giải, KHÔNG mô tả cảm xúc bằng từ khác.
2. Mỗi cụm phải là một chuỗi các từ NẰM LIỀN KỀ NHAU (liên tục) trong câu gốc, theo đúng thứ tự xuất hiện.
3. KHÔNG được ghép hai từ/cụm không nằm sát nhau trong câu gốc thành một cụm.
4. Nếu câu gốc không có cụm cảm xúc rõ ràng, hoặc chỉ là âm thanh/tượng thanh/từ vô nghĩa, trả về [].
5. Trả JSON array thuần (không markdown, không chú thích).

KIỂM TRA TRƯỚC KHI TRẢ: với mỗi cụm bạn định trả, nếu copy nguyên cụm đó và Ctrl+F trong câu gốc KHÔNG tìm thấy nguyên văn liên tục → BỎ cụm đó.

VÍ DỤ:
- Câu gốc: "hôm nay tôi vui vẻ và hạnh phúc"
  Đúng: ["vui vẻ","hạnh phúc"]
  SAI: ["hân hoan"] (đồng nghĩa, không có trong câu gốc), ["vui vẻ hạnh phúc"] (không liền kề — bị "và" chen giữa)

- Câu gốc: "hiihihi"
  Đúng: [] hoặc ["hiihihi"]
  SAI: ["cười khúc khích"], ["cười"], ["vui"], ["hạnh phúc"] — toàn là từ KHÔNG xuất hiện trong câu gốc, dù bạn đoán cảm xúc là cười cũng KHÔNG được tự thêm chữ "cười".

- Câu gốc: "mệt quá đi"
  Đúng: ["mệt quá"]
  SAI: ["kiệt sức"] (đồng nghĩa), ["mệt mỏi"] (chữ "mỏi" không có trong câu gốc)

Câu gốc: ${text}`;

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
    this.genModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
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
