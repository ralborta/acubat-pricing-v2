// pricing_mapper.ts
// Requisitos: npm i openai
import OpenAI from "openai";
import { withLLM, LLM_MODEL } from "./llm";

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
  nombreArchivo?: string;     // nombre del archivo para inferir tipo
  vendorHint?: string;         // hint del proveedor (MOURA, LIQUI MOLY, VARTA, etc.)
  model?: string;             // por defecto gpt-4o-mini
  apiKey?: string;            // si no, toma process.env.OPENAI_API_KEY
  minConfidence?: number;     // default 0.7
  minCoverage?: number;       // default 0.8 (80% numérico en precio)
  minPriceMax?: number;       // default 100000 (ARS)
  maxRetries?: number;         // default 1 (1 reintento con feedback)
}

export interface MapColumnsOutput {
  tipo: string | null;
  modelo: string | null;
  precio_ars: string | null;
  descripcion: string | null;
  identificador: string | null;
  marca?: string | null; // Agregado: marca del producto
  confianza: number;
  confidence?: { // Agregado: confianza por campo
    identificador?: number | null;
    modelo?: number | null;
    marca?: number | null;
    tipo?: number | null;
    precio_ars?: number | null;
    descripcion?: number | null;
  };
  // 🎯 PROOF-OF-LIFE: Diagnóstico de uso de IA
  __diag?: {
    request_id?: string;
    model: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    latency_ms?: number;
    vendorHint?: string;
    fileName?: string;
    sheetName?: string;
  };
  __source?: "IA" | "HEURISTIC";
  __forced?: boolean;
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
    marca?: { // Agregado: evidencia de marca
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
      | "marca"
      | "dimension"
      | "moneda_usd"
      | "desconocida";
    motivo_breve: string;
  }[];
  notas: string[];
}

const DEFAULT_MODEL = "gpt-4o-mini"; // Modelo optimizado: rápido, barato y suficiente para esta tarea

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
function buildSystemPrompt(vendorHint?: string): string {
  const hintText = vendorHint ? `\n\nHINT DE PROVEEDOR: ${vendorHint}\n- Si es MOURA: identificador := columna "CÓDIGO/CODIGO"; modelo := "DENOMINACIÓN COMERCIAL/APLICACIONES" si existe.\n- Si es ADITIVOS o LIQUI MOLY: primera columna numérica = identificador, segunda columna "Producto" = marca, descripcion := FUNCIÓN + " — " + APLICACIÓN.\n- Si es VARTA: sigue las reglas normales de baterías.\n` : '';
  
  return `
Eres especialista senior en pricing de productos automotrices en Argentina (baterías, aditivos, herramientas, etc.).
${hintText}
Usa únicamente las COLUMNAS y la MUESTRA provistas en este turno (ignora conocimiento previo).
Debes mapear exactamente qué columna corresponde a:
- "tipo" (familia/categoría del archivo: "Batería", "Aditivos", "Aditivos Nafta", "Herramientas", "Ca Ag Blindada", "J.I.S.", etc. - INFIERELO del contexto del archivo/hoja, NO uses "batería" por defecto)
- "modelo" (código identificador corto: "UB 550 Ag", "VA40DD/E", números como "2124", "1870", SKU como "7000", etc. - NO uses columnas con texto descriptivo largo como "BATERIA YUASA 6N2-2A". Si la columna "Modelo" contiene texto descriptivo largo, el modelo debe ser el SKU/código de la primera columna)
- "descripcion" (texto descriptivo completo del producto: "BATERIA YUASA 6N2-2A", "Injection Reiniger", etc. - Si la columna "Modelo" contiene texto descriptivo largo con marca y nombre de producto, mapea esa columna como "descripcion", NO como "modelo")
- "marca" (NOMBRE DE COLUMNA que contiene el nombre del producto/marca: incluso si la columna se llama "Producto", debe mapearse como "marca" cuando contiene nombres de productos/marcas como "Injection Reiniger", "Pro-Line", etc. - IMPORTANTE: devuelve el NOMBRE DE LA COLUMNA, NO el valor extraído)
- "precio_ars" (precio en pesos argentinos)
- "descripcion" (función/descripción del producto: columnas como "FUNCIÓN", "APLICACIÓN", o cualquier columna que describa qué hace el producto)

REGLAS OBLIGATORIAS
1) Moneda ARS solamente. En Argentina, "$" es ARS. Rechaza columnas con USD, U$S, US$, "dólar" o mezcla de monedas. No conviertas.
2) Dimensiones PROHIBIDAS (blacklist, en encabezado y contenido): pallet|palet|kg|peso|largo|ancho|alto|mm|cm|ah|cca|dimens|unidad(es)? por pallet|capacidad|volumen
3) Precio (PRIORIDAD ESTRICTA - elegir en este orden):
   a) "PVP Off Line" o "pvp off line" (SIEMPRE la mayor prioridad)
   b) "Precio de Lista" o "precio lista" o "precio lista sugerido"
   c) "Contado" (si existe como columna de precio válida)
   d) "Precio Unitario" (último recurso)
   e) Cualquier otra columna con encabezado "precio|pvp|lista|sugerido proveedor|AR$|ARS|$" PERO SIN palabras USD/dólar
   - Contenido: >=80% de filas con valores numéricos plausibles para Argentina (≈150.000–3.000.000).
   - Si hay duplicados (con/sin IVA), prefiere "precio lista / sugerido proveedor"; si hay dos variantes, elige "sin IVA" y deja nota.
4) Identificador (PRIORIDAD ESTRICTA para encontrar columna de ID):
   a) Columnas con nombres que contengan: "codigo", "código", "cod", "sku", "ref", "referencia", "part number", "artículo", "item", "ean", "upc", "id", "nro"
   b) La columna debe tener alta unicidad (muchos valores distintos) y patrón de código (alfanumérico, pocos espacios)
   c) Prioriza columnas que sean claramente identificadores únicos sobre descripciones largas
   d) Si hay múltiples candidatos, elige la que tenga mayor unicidad y mejor patrón de código
   e) NO uses "modelo" como identificador si contiene texto descriptivo largo (ej: "BATERIA YUASA 6N2-2A")
   f) Si no existe, identificador = modelo (solo si modelo es un código corto, indícalo en notas).
5) Marca (REGLA ESPECIAL):
   a) Si hay una columna llamada "Producto" o similar que contiene nombres de productos/marcas (ej: "Injection Reiniger", "Pro-Line", nombres de marcas), MAPÉALA COMO "marca" (devuelve el NOMBRE DE LA COLUMNA, ej: "Producto")
   b) La segunda columna (columna sin nombre o con nombre genérico) que contiene nombres de productos debe mapearse como "marca", NO como "modelo" ni "descripcion"
   c) Prioriza columnas con nombres de productos/marcas comerciales sobre códigos
   d) CASO ESPECIAL YUASA/MOURA: Si la columna "Modelo" contiene texto descriptivo largo como "BATERIA YUASA 6N2-2A":
      * DEBES mapear esa columna como "descripcion" (NO como modelo) - ES OBLIGATORIO
      * El campo "modelo" en el JSON debe contener el nombre de la columna del SKU/código (ej: "sku "), NO "Modelo"
      * El campo "descripcion" en el JSON debe contener el nombre de la columna descriptiva (ej: "Modelo")
      * El campo "marca" puede ser "Modelo" si esa columna contiene la marca, o null si no hay columna específica de marca
      * IMPORTANTE: Todos los campos (marca, modelo, descripcion, etc.) deben ser NOMBRES DE COLUMNAS, NO valores extraídos
6) Tipo/Categoría (DETECCIÓN INTELIGENTE):
   a) NO uses "batería" por defecto - INFIERE el tipo del contexto:
      - Si el archivo/hoja menciona "ADITIVOS", "ADITIVOS NAFTA" → tipo = "Aditivos" o "Aditivos Nafta"
      - Si menciona "HERRAMIENTAS" → tipo = "Herramientas"
      - Si menciona "BATERÍAS", "BATERIA" → tipo = "Batería"
      - Analiza los headers del archivo y el contenido de las columnas para inferir el tipo
   b) Busca palabras clave en nombres de columnas y en el contenido: "aditivo", "herramienta", "batería", "nafta", "combustible", etc.
   c) Si no puedes inferir con certeza, usa el tipo más general que encuentres en el contexto, nunca asumas "batería"
7) Descripción (REGLA ESPECIAL Y OBLIGATORIA):
   a) Busca columnas que describan la FUNCIÓN o APLICACIÓN del producto
   b) Columnas con nombres como "FUNCIÓN", "APLICACIÓN", "Descripción", "Detalle" que explican qué hace el producto
   c) CASO CRÍTICO - SI la columna "Modelo" contiene texto descriptivo largo (más de 10 caracteres, múltiples palabras, o incluye marca como "BATERIA YUASA 6N2-2A"):
      * OBLIGATORIO: Mapea "Modelo" como "descripcion" en el JSON (campo descripcion = "Modelo")
      * OBLIGATORIO: NO mapees "Modelo" como "modelo" - el modelo debe ser otra columna (ej: "sku ")
      * Ejemplo: Si tienes "sku" con valores "7000" y "Modelo" con "BATERIA YUASA 6N2-2A":
        - modelo = "sku " (nombre de columna del SKU)
        - descripcion = "Modelo" (nombre de columna descriptiva)
        - identificador = "sku " (nombre de columna del SKU)
   d) Si la columna "marca" contiene nombres de productos y hay otra columna con funciones/aplicaciones, usa esa para descripción
   e) Puede ser una columna entre la 2da y 3ra columna si contiene información descriptiva
   f) El campo "descripcion" en tu respuesta JSON DEBE contener el nombre de la columna elegida (ej: "Modelo"), NO puede ser null si existe una columna descriptiva
8) Devuelve los NOMBRES DE COLUMNA EXACTOS tal como aparecen (no renombres).
9) Evidencia: incluye 2–5 muestras por campo y el motivo de la elección.
10) Si la confianza < 0.6 en cualquier campo, déjalo null y explica en notas.
11) Salida estricta: responde solo con JSON que cumpla el schema provisto (sin texto extra).`;
}

/* ------------------------------ USER PAYLOAD ----------------------------- */
function buildUserPayload(columnas: string[], hojas: string[] | undefined, muestra: ColumnSampleRow[], nombreArchivo?: string): string {
  return `NOMBRE DEL ARCHIVO: ${nombreArchivo || 'N/A'}
COLUMNAS: ${JSON.stringify(columnas)}
HOJAS: ${JSON.stringify(hojas ?? [])}
MUESTRA (hasta 10 filas reales):
${JSON.stringify(muestra.slice(0, 10))}

INSTRUCCIONES ESPECIALES:
- Analiza el NOMBRE DEL ARCHIVO y las HOJAS para inferir el TIPO (Aditivos, Herramientas, Baterías, etc.)
- Si la primera columna contiene códigos numéricos (ej: "2124", "1870") y la segunda contiene nombres de productos (ej: "Injection Reiniger"), mapea: primera = identificador, segunda = marca
- Busca columnas "FUNCIÓN" o "APLICACIÓN" para mapear como descripcion`;
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
      marca: { type: ["string","null"] },
      precio_ars: { type: ["string","null"] },
      descripcion: { type: ["string","null"] },
      identificador: { type: ["string","null"] },
      confianza: { type: "number", minimum: 0, maximum: 1 },
      confidence: {
        type: "object",
        additionalProperties: false,
        properties: {
          identificador: { type: ["number","null"] },
          modelo: { type: ["number","null"] },
          marca: { type: ["number","null"] },
          tipo: { type: ["number","null"] },
          precio_ars: { type: ["number","null"] },
          descripcion: { type: ["number","null"] }
        }
      },
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
          },
          marca: {
            type: "object",
            additionalProperties: false,
            properties: {
              columna_elegida: { type: ["string","null"] },
              muestras: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
              motivo: { type: "string" }
            },
            required: ["columna_elegida","muestras","motivo"]
          },
          descripcion: {
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
        required: ["precio_ars","modelo","tipo","descripcion"]
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
              enum: ["precio_ars","modelo","tipo","descripcion","marca","dimension","moneda_usd","desconocida"]
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
    ],
    optional: ["marca", "confidence"] // Marca y confidence son opcionales en el schema
  },
  strict: true as const
};

/* ------------------------------ BLACKLIST -------------------------------- */
const DIM_BLACKLIST = /pallet|palet|kg|peso|largo|ancho|alto|mm|cm|ah|cca|dimens|unidad(?:es)? por pallet|capacidad|volumen/i;
const USD_MARKERS = /usd|u\$s|us\$|dólar|dolar/i;

/* -------------------------- RESPONSE EXTRACTION -------------------------- */
function extractJson(resp: any): MapColumnsOutput | null {
  try {
    // Camino 1: Chat Completions API - response_format con json_schema
    // La respuesta viene en resp.choices[0].message.content cuando hay response_format
    if (resp?.choices && resp.choices[0]?.message?.content) {
      const content = resp.choices[0].message.content;
      try {
        return JSON.parse(content) as MapColumnsOutput;
      } catch {
        // Si no es JSON válido, intentar extraer del texto
        const firstBrace = content.indexOf("{");
        const lastBrace = content.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          const maybe = content.slice(firstBrace, lastBrace + 1);
          return JSON.parse(maybe) as MapColumnsOutput;
        }
      }
    }

    // Camino 2: Tool call (cuando se usan tools)
    if (resp?.choices && resp.choices[0]?.message?.tool_calls) {
      const toolCall = resp.choices[0].message.tool_calls[0];
      if (toolCall?.function?.arguments) {
        return JSON.parse(toolCall.function.arguments) as MapColumnsOutput;
      }
    }

    // Camino 3: Structured Outputs API (formato antiguo)
    const json = resp?.output?.[0]?.content?.find((c: any) => c.type === "output_json")?.json;
    if (json) return json as MapColumnsOutput;

    // Camino 4: Tool call obligatorio (formato antiguo)
    const tool = resp?.output?.[0]?.content?.find((c: any) => c.type === "tool_call");
    if (tool?.name && tool?.arguments) {
      return JSON.parse(tool.arguments) as MapColumnsOutput;
    }

    // Camino 5: Texto directo
    const text = resp?.output_text ?? resp?.output?.[0]?.content?.[0]?.text;
    if (text && typeof text === "string") {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const maybe = text.slice(firstBrace, lastBrace + 1);
        return JSON.parse(maybe) as MapColumnsOutput;
      }
    }
  } catch (e: any) {
    console.error("Error en extractJson:", e?.message);
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
  nombreArchivo,
  vendorHint,
  model = DEFAULT_MODEL,
  apiKey = process.env.OPENAI_API_KEY!,
  minConfidence = 0.7,
  minCoverage = 0.8,
  minPriceMax = 100000,
  maxRetries = 1
}: MapColumnsInput): Promise<{ result: MapColumnsOutput; attempts: number }> {
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada.");

  const client = new OpenAI({ apiKey });
  const system = buildSystemPrompt(vendorHint);
  const user = buildUserPayload(columnas, hojas, muestra, nombreArchivo);

  // 🎯 PROOF-OF-LIFE: Hash del prompt para tracking
  const crypto = require("crypto");
  const promptHash = crypto.createHash("sha1").update(system + "::" + user).digest("hex");

  // 1) Intento con Structured Outputs strict
  // ✅ Construir messages explícitamente sin 'as const' para evitar problemas de serialización
  const messagesArray = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user }
  ];
  
  const basePayload = {
    model: model,
    messages: messagesArray,
    response_format: {
      type: "json_schema" as const,
      json_schema: {
        name: "mapeo_columnas_baterias_ars_v2",
        schema: SCHEMA.schema
      }
    },
    temperature: 0.1,
    max_tokens: 2000
  };

  // 🔍 VALIDACIÓN: Asegurar que messages existe
  if (!basePayload.messages || !Array.isArray(basePayload.messages) || (basePayload.messages as any[]).length === 0) {
    console.error('❌ ERROR: basePayload.messages está vacío o no existe:', basePayload);
    throw new Error('Payload inválido: messages requerido');
  }

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

  // 🔍 VALIDACIÓN: Asegurar que toolsPayload tiene messages
  if (!toolsPayload.messages || !Array.isArray(toolsPayload.messages)) {
    console.error('❌ ERROR: toolsPayload.messages inválido:', toolsPayload);
    throw new Error('Payload inválido: toolsPayload.messages requerido');
  }

  let attempts = 0;
  let lastReasons: string[] = [];
  let response: any;
  let out: MapColumnsOutput | null = null;
  let requestId: string = '';
  let promptTokens: number = 0;
  let completionTokens: number = 0;
  let latencyMs: number = 0;

  // 🎯 PROOF-OF-LIFE: Wrapper con instrumentación
  const t0 = Date.now();
  
  // Primer intento: SO strict
  attempts++;
  
  // 🔍 VALIDACIÓN FINAL antes de enviar
  const payloadToSend = { ...basePayload };
  if (!payloadToSend.messages || !Array.isArray(payloadToSend.messages)) {
    console.error('❌ ERROR CRÍTICO: payloadToSend.messages inválido:', payloadToSend);
    throw new Error('Payload inválido antes de enviar a OpenAI: messages requerido');
  }
  console.log('🔍 Validación payload:', {
    hasMessages: !!payloadToSend.messages,
    messagesLength: payloadToSend.messages?.length || 0,
    model: payloadToSend.model,
    hasResponseFormat: !!payloadToSend.response_format
  });
  
  response = await withLLM(async () => {
    return await client.chat.completions.create(payloadToSend as any);
  }, {
    step: "mapColumnsStrict",
    attempt: attempts,
    model: model || LLM_MODEL,
    promptHash: promptHash.substring(0, 8),
    vendorHint: vendorHint || 'none',
    fileName: nombreArchivo || 'unknown'
  });
  
  latencyMs = Date.now() - t0;
  requestId = (response as any)?.id || `req_${Date.now()}`;
  promptTokens = (response as any)?.usage?.input_tokens || 0;
  completionTokens = (response as any)?.usage?.output_tokens || 0;
  
  out = extractJson(response);

  // Si no hay JSON (host ignora SO), probamos "tool_call obligatorio"
  if (!out) {
    attempts++;
    const t1 = Date.now();
    response = await withLLM(async () => {
      return await client.chat.completions.create(toolsPayload as any);
    }, {
      step: "mapColumnsStrict_retry",
      attempt: attempts,
      model: model || LLM_MODEL,
      promptHash: promptHash.substring(0, 8),
      vendorHint: vendorHint || 'none'
    });
    
    latencyMs += (Date.now() - t1);
    requestId = (response as any)?.id || requestId;
    promptTokens += ((response as any)?.usage?.input_tokens || 0);
    completionTokens += ((response as any)?.usage?.output_tokens || 0);
    
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
      const retryMessagesArray = [
        { role: "system" as const, content: system },
        { role: "user" as const, content: user },
        { role: "user" as const, content: feedback }
      ];
      
      const retryPayload = {
        ...basePayload,
        messages: retryMessagesArray
      };
      
      // 🔍 VALIDACIÓN antes de reintento
      if (!retryPayload.messages || !Array.isArray(retryPayload.messages)) {
        console.error('❌ ERROR CRÍTICO: retryPayload.messages inválido:', retryPayload);
        throw new Error('Payload inválido en reintento: messages requerido');
      }
      
      const t2 = Date.now();
      const retryResp = await withLLM(async () => {
        return await client.chat.completions.create(retryPayload as any);
      }, {
        step: "mapColumnsStrict_retry_with_feedback",
        attempt: attempts,
        model: model || LLM_MODEL,
        promptHash: promptHash.substring(0, 8),
        vendorHint: vendorHint || 'none',
        feedback: true
      });
      
      latencyMs += (Date.now() - t2);
      requestId = (retryResp as any)?.id || requestId;
      promptTokens += ((retryResp as any)?.usage?.input_tokens || 0);
      completionTokens += ((retryResp as any)?.usage?.output_tokens || 0);
      
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

  // 🎯 FALLBACKS HARDCODEADOS: Si la IA no detectó algo crítico, usar heurísticas básicas
  if (out) {
    const H = columnas.map(h => (h || "").toLowerCase().trim());
    const findHeader = (...cands: string[]) => columnas.find(x => x && cands.some(c => x.toLowerCase().trim().includes(c))) || null;

    // Fallback para identificador si no existe
    if (!out.identificador) {
      out.identificador = findHeader("código", "codigo", "sku", "ref", "id", "ean", "upc", "artículo", "articulo", "item", "nro") || null;
      if (out.identificador) {
        out.confianza = Math.min(out.confianza ?? 0.6, 0.6);
        out.notas.push("identificador detectado por fallback hardcodeado");
      }
    }

    // Fallback para precio si no existe
    if (!out.precio_ars) {
      out.precio_ars = findHeader("pvp off line", "precio de lista", "precio lista", "contado", "precio unitario", "precio", "pvp", "ars", "ar$", "$") || null;
      if (out.precio_ars) {
        out.confianza = Math.min(out.confianza ?? 0.6, 0.6);
        out.notas.push("precio_ars detectado por fallback hardcodeado");
      }
    }

    // Fallback para marca si existe columna "Producto" y no se mapeó
    if (!out.marca && findHeader("producto")) {
      out.marca = findHeader("producto");
      if (!out.confidence) out.confidence = {};
      out.confidence.marca = 0.7;
      out.notas.push("marca mapeada desde columna 'Producto' por fallback");
    }
  }

  // 🎯 PROOF-OF-LIFE: Agregar diagnóstico a la respuesta
  if (out) {
    out.__diag = {
      request_id: requestId,
      model: model || LLM_MODEL,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      latency_ms: latencyMs,
      vendorHint: vendorHint || undefined,
      fileName: nombreArchivo || undefined,
      sheetName: hojas?.[0] || undefined
    };
    out.__source = "IA";
  }

  console.log(`🧠 [${requestId}] IA COMPLETADA:`, {
    model: model || LLM_MODEL,
    attempts,
    tokens: `${promptTokens}/${completionTokens}`,
    latency_ms: latencyMs,
    confidence: out?.confianza || 0,
    tipo: out?.tipo || 'null',
    precio_col: out?.precio_ars || 'null'
  });

  return { result: out, attempts };
}

// 🎯 HELPER: Inferir tipo del contexto si la IA no lo detectó (MEJORADO)
export function inferirTipoPorContexto(
  headers: string[], 
  nombreArchivo?: string, 
  nombreHoja?: string,
  muestra?: any[]
): string | null {
  // Crear blob de búsqueda más completo (incluir valores de muestra si existen)
  const headersStr = headers.join(" | ").toLowerCase();
  const fileNameStr = (nombreArchivo || "").toLowerCase();
  const sheetStr = (nombreHoja || "").toLowerCase();
  
  // Si hay muestra, extraer valores de las primeras filas para inferir tipo
  let muestraStr = "";
  if (muestra && muestra.length > 0) {
    const valoresMuestra = muestra.slice(0, 10).flatMap(row => 
      Object.values(row).map(v => String(v || "").toLowerCase())
    ).join(" | ");
    muestraStr = valoresMuestra;
  }
  
  const blob = `${headersStr} ${fileNameStr} ${sheetStr} ${muestraStr}`;
  
  // 🎯 DETECCIÓN MEJORADA DE TIPO (más palabras clave y contexto)
  
  // Aditivos (prioridad alta - puede estar en nombre de producto)
  if (/\baditivos?\b/.test(blob) || /\baditivo\b/.test(blob)) {
    if (/nafta|nafta|gasolina|petrol/i.test(blob)) return "Aditivos Nafta";
    if (/diesel|diesel|gasoil/i.test(blob)) return "Aditivos Diesel";
    if (/combustible|combustible/i.test(blob)) {
      // Si menciona ambos, priorizar nafta (más común)
      if (/nafta|gasolina/i.test(blob)) return "Aditivos Nafta";
      return "Aditivos Diesel";
    }
    return "Aditivos";
  }
  
  // Aceites y lubricantes
  if (/\baceite|aceites|lubricante|motor oil|engine oil/i.test(blob)) {
    if (/nafta|gasolina/i.test(blob)) return "Aditivos Nafta";
    return "Aditivos"; // Aceites pueden considerarse aditivos
  }
  
  // Herramientas
  if (/\bherramientas?|tools|kit|equipo/i.test(blob)) {
    return "Herramientas";
  }
  
  // Baterías (múltiples indicadores)
  if (/\bbater[ií]as?|battery|bateria|ah\s|cca\s|volt|12v|6v/i.test(blob)) {
    return "Batería";
  }
  
  // Detección por nombres específicos de productos
  if (/\binjection|reiniger|flush|cleaner|additive/i.test(blob)) {
    return "Aditivos";
  }
  
  if (/\bmotorbike|motorcycle|moto\s/i.test(blob)) {
    // Puede ser aceite para moto (aditivo) o batería de moto
    if (/\baceite|lubricante/i.test(blob)) return "Aditivos";
    if (/\bbater|volt/i.test(blob)) return "Batería";
    return "Aditivos"; // Por defecto si hay "moto" y aceites
  }
  
  return null;
}

// 🎯 HELPER: Sanitizar tipo para uso consistente en DB/UI
export function sanitizeTipo(tipo: string | null | undefined): string | null {
  if (!tipo) return null;
  const s = tipo.toLowerCase().trim();
  
  if (s.includes("aditivos diesel")) return "ADITIVOS_DIESEL";
  if (s.includes("aditivos nafta")) return "ADITIVOS_NAFTA";
  if (s.includes("aditivos")) return "ADITIVOS";
  if (s.includes("herramient")) return "HERRAMIENTAS";
  if (s.includes("bater")) return "BATERIA";
  
  return tipo; // Mantener original si no coincide
}

