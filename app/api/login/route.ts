import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { senha } = await req.json();
  const senhaCorreta = process.env.APP_PASSWORD;

  if (!senhaCorreta || senha !== senhaCorreta) {
    return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('uvai_senha', senha, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
  });
  return res;
}
