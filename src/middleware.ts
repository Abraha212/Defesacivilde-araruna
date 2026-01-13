import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Verificar cookie de sessão
  const session = request.cookies.get('dc_session')
  const isAuthenticated = !!session?.value

  // Rotas públicas (não requerem autenticação)
  const publicRoutes = ['/login', '/auth/callback', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Rotas de API (permitir sem autenticação)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // Se não está autenticado e não é rota pública/API
  if (!isAuthenticated && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se está autenticado e está na página de login, redirecionar para dashboard
  if (isAuthenticated && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirecionar raiz para dashboard se autenticado
  if (isAuthenticated && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|downloads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|py|txt)$).*)',
  ],
}
