import OpenAI from "openai";

// Lazy initialization para evitar errores en build
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY no configurada");
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

export const LLM_MODEL = process.env.PRICING_LLM_MODEL || "gpt-4o-mini";

// 🎯 PROOF-OF-LIFE: Wrapper para instrumentar llamadas a IA
export async function withLLM<T>(
  fn: () => Promise<T>,
  meta: Record<string, any>
): Promise<T> {
  const t0 = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    console.log(`🧠 [${requestId}] IA LLAMADA INICIADA`, { ...meta, timestamp: new Date().toISOString() });
    
    const out = await fn();
    
    const ms = Date.now() - t0;
    console.log(`🧠 [${requestId}] ✅ IA OK`, { 
      ...meta, 
      ms, 
      latency_ms: ms,
      timestamp: new Date().toISOString() 
    });
    
    return out;
  } catch (e: any) {
    const ms = Date.now() - t0;
    console.error(`🧠 [${requestId}] ❌ IA ERROR`, { 
      ...meta, 
      ms, 
      latency_ms: ms,
      error: e?.message,
      stack: e?.stack,
      timestamp: new Date().toISOString() 
    });
    throw e;
  }
}

