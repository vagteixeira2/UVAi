import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: o ESP32 chama isso depois de executar fisicamente um comando
// (acionar o relé/MOSTFET correspondente).
// Body: { "id": 12, "alvo": "bomba", "ligado": true }
export async function POST(req: NextRequest) {
  const { id, alvo, ligado } = await req.json();

  if (!id || typeof ligado !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'id ou ligado inválido' }, { status: 400 });
  }

  const { error: updErr } = await supabase
    .from('comandos')
    .update({ executado: true, executado_em: new Date().toISOString() })
    .eq('id', id);
  if (updErr) return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });

  const { data: atual } = await supabase
    .from('status_atual')
    .select('*')
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .single();

  const novo = {
    bomba: atual?.bomba ?? false,
    valvula_aberta_pct: atual?.valvula_aberta_pct ?? 0,
    ventilador: atual?.ventilador ?? false,
    led: atual?.led ?? false,
  };

  if (alvo === 'bomba') novo.bomba = ligado;
  if (alvo === 'valvula') novo.valvula_aberta_pct = ligado ? 100 : 0;
  if (alvo === 'ventilador') novo.ventilador = ligado;
  if (alvo === 'led') novo.led = ligado;

  const { error: insErr } = await supabase.from('status_atual').insert(novo);
  if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
