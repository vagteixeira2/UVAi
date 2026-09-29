import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ALVOS = ['bomba', 'valvula', 'ventilador', 'led'];

// GET: o ESP32 chama isso periodicamente (ex: a cada 3-5s) pra saber se
// tem algum comando novo do dashboard esperando pra ser executado.
export async function GET() {
  const { data, error } = await supabase
    .from('comandos')
    .select('*')
    .eq('executado', false)
    .order('criado_em', { ascending: true })
    .limit(20);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, comandos: data });
}

// POST: o dashboard chama isso quando o usuário clica num toggle de atuador.
// Body: { "alvo": "bomba" | "valvula" | "ventilador" | "led", "ligado": true | false }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { alvo, ligado } = body;

  if (!ALVOS.includes(alvo) || typeof ligado !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'alvo ou ligado inválido' }, { status: 400 });
  }

  const { data, error } = await supabase.from('comandos').insert({ alvo, ligado }).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, comando: data });
}
