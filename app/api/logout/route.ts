import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('uvai_senha', '', { maxAge: 0, path: '/' });
  return res;
}
