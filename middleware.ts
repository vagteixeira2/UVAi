import { NextRequest, NextResponse } from 'next/server';

// Protege a tela do dashboard com a senha compartilhada da equipe.
// As rotas /api/leituras e /api/comandos* ficam de fora de propósito —
// o ESP32 não tem como "fazer login", então ele precisa continuar
// acessível sem o cookie de sessão.
export function middleware(req: NextRequest) {
  const cookie = req.cookies.get('uvai_senha')?.value;
  const senhaCorreta = process.env.APP_PASSWORD;

  if (!senhaCorreta || cookie === senhaCorreta) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('from', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!login|api|greenhouse|_next/static|_next/image|favicon.ico).*)'],
};
