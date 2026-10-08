-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez sem problema).

-- 1) Estado da porta no painel
alter table status_atual add column if not exists porta boolean not null default false;

-- 2) Permitir o alvo "porta" na fila de comandos
alter table comandos drop constraint if exists comandos_alvo_check;
alter table comandos add constraint comandos_alvo_check
  check (alvo = any (array['bomba','valvula','ventilador','led','porta']));
