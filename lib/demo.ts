import { Leitura } from './supabase';

// MODO DEMONSTRAÇÃO (variável de ambiente MODO_DEMO na Vercel)
//   MODO_DEMO=true   -> preenche SÓ os campos sem sensor real (null). Dado real do ESP32 sempre vence.
//   MODO_DEMO=total  -> TUDO simulado (ignora os sensores). Bom para apresentar sem depender de placa.
//   MODO_DEMO=false  -> desligado (dados 100% reais).
// O painel mostra o selo "DEMONSTRAÇÃO" sempre que o modo estiver ligado.
//
// Os números imitam uma estufa de uvas com clima CONTROLADO em Natal-RN (UTC-3, sem horário
// de verão). Tudo é calculado só a partir do horário (sem sorteio), então um mesmo instante
// sempre gera o mesmo valor e os gráficos ficam suaves, sem "tremer" a cada atualização.
//
//   Temperatura   22–30 °C   mais fria de madrugada, pico no meio da tarde; ventilação segura o teto
//   Umidade do ar 60–75 %    inversa da temperatura; mantida < 80 % para evitar míldio/oídio
//   Luminosidade  0–92 %     segue o sol de Natal (nasce ~05:15, põe ~17:20) com nuvens leves
//   Umidade solo  55–66 %    "dente de serra": sobe nas irrigações (06:00, 10:30, 15:00), seca devagar
//   Reservatório  73–82 %    cai a cada irrigação e reabastece à noite (20h–21h)
//   Caixa elevada 84–92 %    dá um mergulho curto a cada irrigação e a bomba recompõe
//   Vento         ~8–25 km/h alísios de Natal, mais fortes à tarde

export type ModoDemo = 'off' | 'parcial' | 'total';

export function lerModoDemo(valor: string | undefined): ModoDemo {
  const v = (valor ?? '').trim().toLowerCase();
  if (v === 'total') return 'total';
  if (v === 'true') return 'parcial';
  return 'off';
}

type Campo =
  | 'temperatura' | 'umidade_solo' | 'umidade_ar' | 'luminosidade'
  | 'nivel_reservatorio' | 'nivel_caixa_elevada' | 'velocidade_vento';

const CAMPOS: Campo[] = [
  'temperatura', 'umidade_solo', 'umidade_ar', 'luminosidade',
  'nivel_reservatorio', 'nivel_caixa_elevada', 'velocidade_vento',
];

const NASCER = 5.25;  // 05:15
const POR = 17.33;    // 17:20
const IRRIGACOES = [6.0, 10.5, 15.0]; // hora de início de cada irrigação
const DURACAO_H = 0.25;               // 15 min

const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;
const limitar = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

// Ruído suave e determinístico (-1 a 1) em função do tempo, em minutos.
function ruido(min: number, semente: number): number {
  return (Math.sin(min / (9 + semente * 2.3) + semente) + 0.5 * Math.sin(min / (3.7 + semente) + semente * 2)) / 1.5;
}

// Interpola uma lista de pontos [hora, valor] (do dia todo) em linha reta.
function curva(h: number, pts: [number, number][]): number {
  for (let i = 1; i < pts.length; i++) {
    const [h0, v0] = pts[i - 1];
    const [h1, v1] = pts[i];
    if (h <= h1) return v0 + ((v1 - v0) * (h - h0)) / (h1 - h0 || 1);
  }
  return pts[pts.length - 1][1];
}

const RESERVATORIO: [number, number][] = [
  [0, 82], [6, 82], [6.25, 79], [10.5, 79], [10.75, 76], [15, 76], [15.25, 73], [20, 73], [21, 82], [24, 82],
];
const CAIXA: [number, number][] = [
  [0, 92], [5.9, 92], [6.25, 84], [6.6, 92],
  [10.4, 92], [10.75, 84], [11.1, 92],
  [14.9, 92], [15.25, 84], [15.6, 92], [24, 92],
];

// Umidade do solo (%): sobe durante a irrigação e seca devagar (decaimento exponencial).
function solo(h: number): number {
  const BASE = 55.5, PICO = 10, TAU = 2.6; // TAU em horas
  const inicios = [...IRRIGACOES.map((x) => x - 24), ...IRRIGACOES, ...IRRIGACOES.map((x) => x + 24)];
  const ultimo = inicios.filter((x) => x <= h).pop() as number;
  const anterior = inicios.filter((x) => x < ultimo).pop() as number;
  const dt = h - ultimo;
  const v0 = BASE + PICO * Math.exp(-(ultimo - anterior - DURACAO_H) / TAU); // valor ao iniciar a irrigação
  if (dt < DURACAO_H) return v0 + (BASE + PICO - v0) * (dt / DURACAO_H);
  return BASE + PICO * Math.exp(-(dt - DURACAO_H) / TAU);
}

function simular(campo: Campo, quando: Date): number {
  const h = (quando.getUTCHours() - 3 + quando.getUTCMinutes() / 60 + quando.getUTCSeconds() / 3600 + 24) % 24;
  const min = quando.getTime() / 60000;
  const sol = Math.max(0, Math.sin(((h - NASCER) / (POR - NASCER)) * Math.PI)); // 0 de noite, 1 ao meio-dia
  const nuvem = 0.06 + 0.06 * (ruido(min, 7) + 1); // 0–0,18 de sombra

  switch (campo) {
    case 'temperatura': {
      const t = 26 + 4 * Math.sin(((h - 9.5) / 24) * 2 * Math.PI) + 0.3 * ruido(min, 1); // mín ~03:30, máx ~15:30
      return r1(Math.min(t, 29.8 + 0.2 * ruido(min, 9))); // ventilação/exaustão segura o teto
    }
    case 'umidade_ar': {
      const t = 26 + 4 * Math.sin(((h - 9.5) / 24) * 2 * Math.PI);
      return r0(limitar(74 - (14 * (t - 22)) / 8 + 1.5 * ruido(min, 2), 58, 77));
    }
    case 'luminosidade':
      return r0(limitar(92 * Math.pow(sol, 0.7) * (1 - nuvem), 0, 100));
    case 'umidade_solo':
      return r0(limitar(solo(h) + 0.6 * ruido(min, 3), 50, 70));
    case 'nivel_reservatorio':
      return r0(curva(h, RESERVATORIO) + 0.4 * ruido(min, 4));
    case 'nivel_caixa_elevada':
      return r0(curva(h, CAIXA) + 0.4 * ruido(min, 5));
    case 'velocidade_vento':
      return r0(limitar(13 + 7 * sol + 3 * ruido(min, 6), 3, 28));
  }
}

function completar(l: Leitura, quando: Date, sobrescrever: boolean): Leitura {
  const copia: Leitura = { ...l };
  for (const c of CAMPOS) {
    if (sobrescrever || copia[c] === null || copia[c] === undefined) (copia as any)[c] = simular(c, quando);
  }
  return copia;
}

function vazia(i: number, quando: Date): Leitura {
  return {
    id: -(i + 1), criado_em: quando.toISOString(), temperatura: null, umidade_solo: null,
    umidade_ar: null, luminosidade: null, nivel_reservatorio: null,
    nivel_caixa_elevada: null, velocidade_vento: null,
  };
}

export function aplicarDemo(historico: Leitura[], modo: ModoDemo = 'parcial'): Leitura[] {
  if (modo === 'off') return historico;
  const agora = Date.now();

  // 12 pontos espaçados de 10 em 10 min (últimas ~2 h) para os gráficos mostrarem uma curva de verdade.
  // (Os ESP32 enviam a cada 5 s, então 12 leituras reais cobrem só 1 minuto e o gráfico ficaria reto.)
  if (modo === 'total' || historico.length === 0) {
    return Array.from({ length: 12 }, (_, i) => {
      const quando = new Date(agora - (11 - i) * 10 * 60000);
      return completar(vazia(i, quando), quando, true);
    });
  }
  return historico.map((l) => completar(l, new Date(l.criado_em), false));
}
