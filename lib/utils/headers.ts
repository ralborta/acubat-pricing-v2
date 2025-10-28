/**
 * Normaliza encabezados de Excel para comparación segura
 * - Sin tildes
 * - Minúsculas
 * - Sin basura
 */
export function normHeader(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')              // quita acentos
    .replace(/[\u0300-\u036f]/g, '') // restos de tildes
    .replace(/\s+/g, ' ')          // colapsa espacios
    .replace(/[^\w #%]/g, ' ')     // limpia raro, deja %, #
    .trim();
}

