/*
  Limpieza de datos antiguos en Supabase.
  Uso local/CI:
    node scripts/cleanup_pricing.js --cutoff 2025-10-21 [--execute]

  Requiere env:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
*/

const { createClient } = require('@supabase/supabase-js')

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { cutoff: null, execute: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--cutoff') {
      opts.cutoff = args[++i]
    } else if (a === '--execute') {
      opts.execute = true
    }
  }
  if (!opts.cutoff) {
    console.error('Falta --cutoff YYYY-MM-DD')
    process.exit(1)
  }
  return opts
}

async function main() {
  const { cutoff, execute } = parseArgs()
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log(`⏳ Analizando datos anteriores a ${cutoff} (execute=${execute})`)

  // Buscar sesiones a borrar
  const { data: sesiones, error: errSes } = await supabase
    .from('sesiones_pricing')
    .select('id, nombre_sesion, archivo_original, fecha_procesamiento')
    .lt('fecha_procesamiento', cutoff)

  if (errSes) {
    console.error('Error listando sesiones:', errSes)
    process.exit(1)
  }

  const sesionIds = (sesiones || []).map(s => s.id)
  console.log(`📊 Sesiones a borrar: ${sesionIds.length}`)

  if (sesionIds.length === 0) {
    console.log('Nada para borrar. Listo.')
    return
  }

  // Contar productos a borrar
  const { count: productosCount, error: errCount } = await supabase
    .from('productos_pricing')
    .select('*', { count: 'exact', head: true })
    .in('sesion_id', sesionIds)

  if (errCount) {
    console.error('Error contando productos:', errCount)
    process.exit(1)
  }
  console.log(`📊 Productos a borrar: ${productosCount}`)

  if (!execute) {
    console.log('🔎 Dry-run: no se borró nada. Agrega --execute para ejecutar.')
    return
  }

  // Borrar productos
  console.log('🗑️ Borrando productos...')
  const { error: errDelProd } = await supabase
    .from('productos_pricing')
    .delete()
    .in('sesion_id', sesionIds)
  if (errDelProd) {
    console.error('Error borrando productos:', errDelProd)
    process.exit(1)
  }

  // Borrar sesiones
  console.log('🗑️ Borrando sesiones...')
  const { error: errDelSes } = await supabase
    .from('sesiones_pricing')
    .delete()
    .lt('fecha_procesamiento', cutoff)
  if (errDelSes) {
    console.error('Error borrando sesiones:', errDelSes)
    process.exit(1)
  }

  console.log('✅ Limpieza completada.')
}

main().catch(e => { console.error(e); process.exit(1) })


