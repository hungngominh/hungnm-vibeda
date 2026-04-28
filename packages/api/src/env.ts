import { z } from 'zod';

const base = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  AI_PROVIDER: z.enum(['openai', 'gemini', 'vegaproxy', 'azure']).default('gemini'),
  OPENAI_API_KEY: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),
  VEGAPROXY_API_KEY: z.string().default(''),
  VEGAPROXY_ENDPOINT: z.string().default('https://claudinge.allianceitsc.com'),
  AZURE_OPENAI_API_KEY: z.string().default(''),
  AZURE_OPENAI_ENDPOINT: z.string().default(''),
  AZURE_OPENAI_DEPLOYMENT: z.string().default(''),
});

const schema = base.superRefine((data, ctx) => {
  if (data.AI_PROVIDER === 'openai' && !data.OPENAI_API_KEY) {
    ctx.addIssue({ code: 'custom', path: ['OPENAI_API_KEY'], message: 'Required when AI_PROVIDER=openai' });
  }
  if (data.AI_PROVIDER === 'gemini' && !data.GEMINI_API_KEY) {
    ctx.addIssue({ code: 'custom', path: ['GEMINI_API_KEY'], message: 'Required when AI_PROVIDER=gemini' });
  }
  if (data.AI_PROVIDER === 'vegaproxy' && !data.VEGAPROXY_API_KEY) {
    ctx.addIssue({ code: 'custom', path: ['VEGAPROXY_API_KEY'], message: 'Required when AI_PROVIDER=vegaproxy' });
  }
  if (data.AI_PROVIDER === 'azure' && !data.AZURE_OPENAI_API_KEY) {
    ctx.addIssue({ code: 'custom', path: ['AZURE_OPENAI_API_KEY'], message: 'Required when AI_PROVIDER=azure' });
  }
});

export type Env = z.infer<typeof base>;

export function validateEnvValues(raw: Record<string, unknown>): Env {
  return schema.parse(raw) as Env;
}

const parsed = schema.safeParse(process.env);
if (!parsed.success && !process.env['VITEST']) {
  console.error('❌ Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

export const env = (parsed.success ? parsed.data : {}) as Env;
