import { supabase } from '@/lib/supabase';
import DashboardClient from './DashboardClient';
import { aplicarDemo } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [{ data: historico }, { data: s }, { data: a }, { data: c }, { data: pend }] = await Promise.all([
    supabase.from('leituras').select('*').order('criado_em', { ascending: false }).limit(12),
    supabase.from('status_atual').select('*').order('atualizado_em', { ascending: false }).limit(1),
    supabase.from('alertas').select('*').eq('resolvido', false).order('criado_em', { ascending: false }).limit(8),
    supabase.from('configuracoes').select('*'),
    supabase.from('comandos').select('*').eq('executado', false).order('criado_em', { ascending: false }),
  ]);

  const demo = process.env.MODO_DEMO === 'true';
  const bruto = (historico ?? []).slice().reverse(); // mais antigo -> mais recente, para os sparklines
  const ordenado = demo ? aplicarDemo(bruto) : bruto;

  return (
    <DashboardClient
      leitura={ordenado[ordenado.length - 1] ?? null}
      historico={ordenado}
      status={s?.[0] ?? null}
      alertas={a ?? []}
      config={c ?? []}
      comandosPendentes={pend ?? []}
      demo={demo}
    />
  );
}
