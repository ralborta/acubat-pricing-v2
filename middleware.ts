import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rutas que no requieren autenticación
  const publicRoutes = ['/login']
  const { pathname } = request.nextUrl

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar si hay sesión en localStorage (esto solo funciona en el cliente)
  // Para el servidor, asumimos que si no es /login, está autenticado
  // En una implementación real, usarías cookies o JWT

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
