import { supabase } from '@/lib/supabase';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [{ data: l }, { data: s }, { data: a }, { data: c }] = await Promise.all([
    supabase.from('leituras').select('*').order('criado_em', { ascending: false }).limit(1),
    supabase.from('status_atual').select('*').order('atualizado_em', { ascending: false }).limit(1),
    supabase.from('alertas').select('*').eq('resolvido', false).order('criado_em', { ascending: false }).limit(6),
    supabase.from('configuracoes').select('*'),
  ]);

  return (
    <DashboardClient
      leitura={l?.[0] ?? null}
      status={s?.[0] ?? null}
      alertas={a ?? []}
      config={c ?? []}
    />
  );
}
