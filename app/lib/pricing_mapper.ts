// pricing_mapper.ts
// Requisitos: npm i openai
import OpenAI from "openai";

// 🎯 CONFIGURACIÓN HÍBRIDA: Supabase + Local + Fallback (CLIENT-SIDE)
async function obtenerConfiguracion() {
  try {
    // 🚀 PRIMER INTENTO: Cargar desde Supabase
    console.log('🔍 Intentando cargar configuración desde Supabase...');
    const { default: configManager } = await import('../../lib/configManagerSupabase');
    const configManagerInstance = new configManager();
    const config = await configManagerInstance.getCurrentConfig();
    
    console.log('✅ Configuración cargada desde Supabase:', config);
    return config;
    
  } catch (error) {
    console.error('❌ Error cargando desde Supabase:', error);
    
    try {
      // 🔄 SEGUNDO INTENTO: Cargar desde ConfigManager local (funciona en cliente)
      console.log('🔍 Intentando cargar configuración desde ConfigManager local...');
      const configManager = await import('../../lib/configManagerLocal');
      const config = await configManager.default.getCurrentConfig();
      
      console.log('✅ Configuración cargada desde ConfigManager local:', config);
      return config;
      
    } catch (managerError) {
      console.error('❌ Error cargando desde ConfigManager local:', managerError);
      console.log('⚠️ Usando valores por defecto como último recurso');
      
      // ÚLTIMO RECURSO: Valores por defecto hardcodeados
      return {
        iva: 21,
        markups: { mayorista: 22, directa: 60, distribucion: 20 },
        factoresVarta: { factorBase: 40, capacidad80Ah: 35 },
        promociones: false,
        comisiones: { mayorista: 5, directa: 8, distribucion: 6 }
      };
    }
  }
}

export type ColumnSampleRow = Record<string, unknown>;

export interface MapColumnsInput {
  columnas: string[];
  hojas?: string[];
  muestra: ColumnSampleRow[]; // pasa 5–10 filas reales
  model?: string;             // por defecto gpt-4.1
  apiKey?: string;            // si no, toma process.env.OPENAI_API_KEY
  minConfidence?: number;     // default 0.7
  minCoverage?: number;       // default 0.8 (80% numérico en precio)
  minPriceMax?: number;       // default 100000 (ARS)
  maxRetries?: number;        // default 1 (1 reintento con feedback)
}

export interface MapColumnsOutput {
  tipo: string | null;
  modelo: string | null;
  precio_ars: string | null;
  descripcion: string | null;
  identificador: string | null;
  confianza: number;
  evidencia: {
    precio_ars: {
      columna_elegida: string | null;
      muestras: string[];
      motivo: string;
      coverage_numerico?: number;
      rango_min?: number | null;
      rango_max?: number | null;
    };
    modelo: {
      columna_elegida: string | null;
      muestras: string[];
      motivo: string;
    };
    tipo: {
      columna_elegida: string | null;
      muestras: string[];
      motivo: string;
    };
  };
  clasificacion_columnas?: {
    columna: string;
    categoria_inferida:
      | "precio_ars"
      | "modelo"
      | "tipo"
      | "descripcion"
      | "dimension"
      | "moneda_usd"
      | "desconocida";
    motivo_breve: string;
  }[];
  notas: string[];
}

const DEFAULT_MODEL = "gpt-4"; // Cambiado a gpt-4 para mejor precisión

// 🎯 FUNCIÓN PARA APLICAR CONFIGURACIÓN DEL SISTEMA
export async function aplicarConfiguracionPricing(precioBase: number, canal: 'mayorista' | 'directa' | 'distribucion'): Promise<{
  precioConIva: number;
  precioConMarkup: number;
  precioFinal: number;
  iva: number;
  markup: number;
  comision: number;
}> {
  try {
    // Obtener configuración actual del sistema
    const config = await obtenerConfiguracion();
    
    // Aplicar IVA
    const iva = config.iva || 21;
    const precioConIva = precioBase * (1 + iva / 100);
    
    // Aplicar markup según canal
    let markup = 0;
    switch (canal) {
      case 'mayorista':
        markup = config.markups?.mayorista || 22;
        break;
      case 'directa':
        markup = config.markups?.directa || 60;
        break;
      case 'distribucion':
        markup = config.markups?.distribucion || 20;
        break;
      default:
        markup = 22; // Default mayorista
    }
    
    const precioConMarkup = precioConIva * (1 + markup / 100);
    
    // Aplicar comisión según canal
    let comision = 0;
    switch (canal) {
      case 'mayorista':
        comision = config.comisiones?.mayorista || 5;
        break;
      case 'directa':
        comision = config.comisiones?.directa || 8;
        break;
      case 'distribucion':
        comision = config.comisiones?.distribucion || 6;
        break;
      default:
        comision = 5; // Default mayorista
    }
    
    const precioFinal = precioConMarkup * (1 + comision / 100);
    
    return {
      precioConIva: Math.round(precioConIva),
      precioConMarkup: Math.round(precioConMarkup),
      precioFinal: Math.round(precioFinal),
      iva,
      markup,
      comision
    };
  } catch (error) {
    console.error('❌ Error aplicando configuración de pricing:', error);
    // Retornar valores por defecto si hay error
    return {
      precioConIva: Math.round(precioBase * 1.21),
      precioConMarkup: Math.round(precioBase * 1.21 * 1.22),
      precioFinal: Math.round(precioBase * 1.21 * 1.22 * 1.05),
      iva: 21,
      markup: 22,
      comision: 5
    };
  }
}

/* ----------------------------- SYSTEM PROMPT ----------------------------- */
function buildSystemPrompt(): string {
  return `
Eres especialista senior en pricing de baterías automotrices en Argentina.
Usa únicamente las COLUMNAS y la MUESTRA provistas en este turno (ignora conocimiento previo).
Debes mapear exactamente qué columna corresponde a:
- "tipo" (familia/categoría: "Ca Ag Blindada", "J.I.S.", "Batería")
- "modelo" (código identificador: "UB 550 Ag", "VA40DD/E")
- "precio_ars" (precio en pesos argentinos)
- "descripcion" (si existe)

REGLAS OBLIGATORIAS
1) Moneda ARS solamente. En Argentina, "$" es ARS. Rechaza columnas con USD, U$S, US$, "dólar" o mezcla de monedas. No conviertas.
2) Dimensiones PROHIBIDAS (blacklist, en encabezado y contenido): pallet|palet|kg|peso|largo|ancho|alto|mm|cm|ah|cca|dimens|unidad(es)? por pallet|capacidad|volumen
3) Precio (prioridad)
   - Encabezados sugerentes: precio|precio lista|pvp|sugerido proveedor|lista|AR$|ARS|$
   - Contenido: >=80% de filas con valores numéricos plausibles para Argentina (≈150.000–3.000.000).
   - Si hay duplicados (con/sin IVA), prefiere "precio lista / sugerido proveedor"; si hay dos variantes, elige "sin IVA" y deja nota.
4) Identificador: intenta "modelo" como código más específico; si no existe, identificador = nombre (indícalo en notas).
5) Devuelve los NOMBRES DE COLUMNA EXACTOS tal como aparecen (no renombres).
6) Evidencia: incluye 2–5 muestras por campo y el motivo de la elección.
7) Si la confianza < 0.6 en cualquier campo, déjalo null y explica en notas.
8) Salida estricta: responde solo con JSON que cumpla el schema provisto (sin texto extra).`;
}

/* ------------------------------ USER PAYLOAD ----------------------------- */
function buildUserPayload(columnas: string[], hojas: string[] | undefined, muestra: ColumnSampleRow[]): string {
  return `COLUMNAS: ${JSON.stringify(columnas)}
HOJAS: ${JSON.stringify(hojas ?? [])}
MUESTRA (hasta 10 filas reales):
${JSON.stringify(muestra.slice(0, 10))}`;
}

/* -------------------------------- SCHEMA -------------------------------- */
const SCHEMA = {
  name: "mapeo_columnas_baterias_ars_v2",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      tipo: { type: ["string","null"] },
      modelo: { type: ["string","null"] },
      precio_ars: { type: ["string","null"] },
      descripcion: { type: ["string","null"] },
      identificador: { type: ["string","null"] },
      confianza: { type: "number", minimum: 0, maximum: 1 },
      evidencia: {
        type: "object",
        additionalProperties: false,
        properties: {
          precio_ars: {
            type: "object",
            additionalProperties: false,
            properties: {
              columna_elegida: { type: ["string","null"] },
              muestras: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
              motivo: { type: "string" },
              coverage_numerico: { type: "number", minimum: 0, maximum: 1 },
              rango_min: { type: ["number","null"] },
              rango_max: { type: ["number","null"] }
            },
            required: ["columna_elegida","muestras","motivo","coverage_numerico","rango_min","rango_max"]
          },
          modelo: {
            type: "object",
            additionalProperties: false,
            properties: {
              columna_elegida: { type: ["string","null"] },
              muestras: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
              motivo: { type: "string" }
            },
            required: ["columna_elegida","muestras","motivo"]
          },
          tipo: {
            type: "object",
            additionalProperties: false,
            properties: {
              columna_elegida: { type: ["string","null"] },
              muestras: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
              motivo: { type: "string" }
            },
            required: ["columna_elegida","muestras","motivo"]
          }
        },
        required: ["precio_ars","modelo","tipo"]
      },
      clasificacion_columnas: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            columna: { type: "string" },
            categoria_inferida: {
              type: "string",
              enum: ["precio_ars","modelo","tipo","descripcion","dimension","moneda_usd","desconocida"]
            },
            motivo_breve: { type: "string" }
          },
          required: ["columna","categoria_inferida","motivo_breve"]
        }
      },
      notas: { type: "array", items: { type: "string", maxLength: 240 } }
    },
    required: [
      "tipo",
      "modelo",
      "precio_ars",
      "descripcion",
      "identificador",
      "confianza",
      "evidencia",
      "clasificacion_columnas",
      "notas"
    ]
  },
  strict: true as const
};

/* ------------------------------ BLACKLIST -------------------------------- */
const DIM_BLACKLIST = /pallet|palet|kg|peso|largo|ancho|alto|mm|cm|ah|cca|dimens|unidad(?:es)? por pallet|capacidad|volumen/i;
const USD_MARKERS = /usd|u\$s|us\$|dólar|dolar/i;

/* -------------------------- RESPONSE EXTRACTION -------------------------- */
function extractJson(resp: any): MapColumnsOutput | null {
  try {
    // Camino 1: Structured Outputs (json)
    const json = resp?.output?.[0]?.content?.find((c: any) => c.type === "output_json")?.json;
    if (json) return json as MapColumnsOutput;

    // Camino 2: Tool call obligatorio (fallback)
    const tool = resp?.output?.[0]?.content?.find((c: any) => c.type === "tool_call");
    if (tool?.name && tool?.arguments) {
      return JSON.parse(tool.arguments) as MapColumnsOutput;
    }

    // Camino 3: Por si vino como texto (no debería con strict)
    const text = resp?.output_text ?? resp?.output?.[0]?.content?.[0]?.text;
    if (text && typeof text === "string") {
      // Intento parsear JSON crudo
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const maybe = text.slice(firstBrace, lastBrace + 1);
        return JSON.parse(maybe) as MapColumnsOutput;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/* ------------------------------- VALIDATOR ------------------------------- */
function postCheck(
  out: MapColumnsOutput,
  {
    minConfidence = 0.7,
    minCoverage = 0.8,
    minPriceMax = 100000
  }: { minConfidence?: number; minCoverage?: number; minPriceMax?: number }
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Confianza global
  if (typeof out.confianza !== "number" || out.confianza < minConfidence) {
    reasons.push(`confianza baja: ${out.confianza}`);
  }

  // Columnas no deben estar en blacklist de dimensiones
  const suspectCols = [out.tipo, out.modelo, out.precio_ars, out.identificador].filter(Boolean) as string[];
  for (const col of suspectCols) {
    if (DIM_BLACKLIST.test(col)) reasons.push(`columna sospechosa por dimensiones: ${col}`);
  }

  // Precio: cobertura y rango plausibles
  const ev = out.evidencia?.precio_ars;
  if (!ev?.columna_elegida) reasons.push("precio_ars sin columna_elegida");
  if ((ev?.coverage_numerico ?? 0) < minCoverage) reasons.push(`coverage_numerico bajo: ${ev?.coverage_numerico}`);
  if ((ev?.rango_max ?? 0) < minPriceMax) reasons.push(`rango_max implausible: ${ev?.rango_max}`);

  // Columnas clasificadas como USD o dimension no pueden ser elegidas
  for (const c of out.clasificacion_columnas ?? []) {
    if (
      (c.categoria_inferida === "dimension" || c.categoria_inferida === "moneda_usd") &&
      [out.tipo, out.modelo, out.precio_ars, out.identificador].includes(c.columna)
    ) {
      reasons.push(`columna elegida clasificada como ${c.categoria_inferida}: ${c.columna}`);
    }
    if (USD_MARKERS.test(c.columna)) {
      reasons.push(`marcador USD en nombre de columna: ${c.columna}`);
    }
  }

  return { valid: reasons.length === 0, reasons };
}

/* --------------------------------- API ---------------------------------- */
export async function mapColumnsStrict({
  columnas,
  hojas,
  muestra,
  model = DEFAULT_MODEL,
  apiKey = process.env.OPENAI_API_KEY!,
  minConfidence = 0.7,
  minCoverage = 0.8,
  minPriceMax = 100000,
  maxRetries = 1
}: MapColumnsInput): Promise<{ result: MapColumnsOutput; attempts: number }> {
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada.");

  const client = new OpenAI({ apiKey });
  const system = buildSystemPrompt();
  const user = buildUserPayload(columnas, hojas, muestra);

  // 1) Intento con Structured Outputs strict
  const basePayload = {
    model,
    input: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    text: {
      format: {
        type: "json_schema" as const,
        schema: SCHEMA.schema,
        name: "mapeo_columnas_baterias_ars_v2"
      }
    },
    temperature: 0.1,
    max_output_tokens: 900
  };

  // Fallback: herramienta que obliga tool_call si el host ignora response_format
  const toolsPayload = {
    ...basePayload,
    tools: [
      {
        type: "function" as const,
        function: {
          name: "emit_mapeo",
          description: "Devuelve el mapeo de columnas estrictamente validado.",
          parameters: SCHEMA.schema
        }
      }
    ],
    tool_choice: { type: "function" as const, function: { name: "emit_mapeo" } }
  };

  let attempts = 0;
  let lastReasons: string[] = [];
  let response: any;
  let out: MapColumnsOutput | null = null;

  // Primer intento: SO strict
  attempts++;
  response = await client.chat.completions.create(basePayload as any);
  out = extractJson(response);

  // Si no hay JSON (host ignora SO), probamos "tool_call obligatorio"
  if (!out) {
    attempts++;
    response = await client.chat.completions.create(toolsPayload as any);
    out = extractJson(response);
  }

  // Validación local + reintento con feedback si corresponde
  if (out) {
    let check = postCheck(out, { minConfidence, minCoverage, minPriceMax });
    if (!check.valid && attempts <= (1 + maxRetries)) {
      lastReasons = check.reasons;
      const feedback = `DIAGNÓSTICO: Mapeo INVALIDADO. Motivos: ${check.reasons.join(
        " | "
      )}. Re-mapear evitando cualquier columna cuyo nombre o contenido coincida con el blacklist (dimensiones o USD). Si la confianza es baja, devuelve null y explica en notas.`;

      attempts++;
      const retryPayload = {
        ...basePayload,
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
          { role: "user", content: feedback }
        ]
      };
      const retryResp = await client.chat.completions.create(retryPayload as any);
      const retryOut = extractJson(retryResp);
      if (retryOut) {
        out = retryOut;
        check = postCheck(out, { minConfidence, minCoverage, minPriceMax });
        if (!check.valid) {
          throw new Error(`Post-check falló tras reintento: ${check.reasons.join(" | ")}`);
        }
      } else {
        throw new Error("No se pudo extraer JSON en el reintento.");
      }
    }
  } else {
    throw new Error("No se pudo extraer JSON del modelo (verifica que uses Responses API, no Chat Completions).");
  }

  return { result: out, attempts };
}

