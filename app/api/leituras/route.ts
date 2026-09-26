import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// O ESP32 envia um POST com JSON no formato:
// {
//   "temperatura": 24.8,
//   "umidade_solo": 52,
//   "umidade_ar": 64,
//   "luminosidade": 78,
//   "nivel_reservatorio": 61,
//   "nivel_caixa_elevada": 78,
//   "velocidade_vento": 12
// }
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { error } = await supabase.from('leituras').insert({
    temperatura: body.temperatura ?? null,
    umidade_solo: body.umidade_solo ?? null,
    umidade_ar: body.umidade_ar ?? null,
    luminosidade: body.luminosidade ?? null,
    nivel_reservatorio: body.nivel_reservatorio ?? null,
    nivel_caixa_elevada: body.nivel_caixa_elevada ?? null,
    velocidade_vento: body.velocidade_vento ?? null,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
