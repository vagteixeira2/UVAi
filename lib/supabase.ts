import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

export type Leitura = {
  id: number;
  criado_em: string;
  temperatura: number | null;
  umidade_solo: number | null;
  umidade_ar: number | null;
  luminosidade: number | null;
  nivel_reservatorio: number | null;
  nivel_caixa_elevada: number | null;
  velocidade_vento: number | null;
};

export type StatusAtual = {
  id: number;
  atualizado_em: string;
  bomba: boolean;
  valvula_aberta_pct: number;
  ventilador: boolean;
  led: boolean;
};

export type Alerta = {
  id: number;
  criado_em: string;
  nivel: 'info' | 'ok' | 'warn' | 'crit';
  titulo: string;
  descricao: string | null;
  resolvido: boolean;
};

export type Configuracao = {
  chave: string;
  valor: number;
  descricao: string | null;
};

export type Comando = {
  id: number;
  criado_em: string;
  alvo: 'bomba' | 'valvula' | 'ventilador' | 'led';
  ligado: boolean;
  executado: boolean;
  executado_em: string | null;
};
