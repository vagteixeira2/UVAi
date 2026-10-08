import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Cada ESP32 envia só os sensores que ele mesmo lê (JSON "chato", sem aninhar):
//   ESP da bomba:   { "nivel_reservatorio": 61, "nivel_caixa_elevada": 78 }
//   ESP do solo:    { "umidade_solo": 52 }
//   ESP do clima:   { "temperatura": 24.8, "umidade_ar": 64 }
// O servidor completa o que faltou com a última leitura salva, então o painel
// sempre enxerga uma linha "inteira" mesmo com várias placas enviando em separado.
const CAMPOS = [
  'temperatura',
  'umidade_solo',
  'umidade_ar',
  'luminosidade',
  'nivel_reservatorio',
  'nivel_caixa_elevada',
  'velocidade_vento',
] as const;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data: ultima } = await supabase
    .from('leituras')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nova: Record<string, number | null> = {};
  for (const campo of CAMPOS) {
    const enviado = body[campo];
    nova[campo] = typeof enviado === 'number' ? enviado : ultima?.[campo] ?? null;
  }

  const { error } = await supabase.from('leituras').insert(nova);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
