import { Leitura } from './supabase';

// MODO DEMONSTRAÇÃO (variável de ambiente MODO_DEMO=true)
// Preenche só os campos que NÃO vieram de um sensor real (null) com valores
// plausíveis para um dia no semiárido nordestino. Qualquer valor real enviado por
// um ESP32 tem prioridade e nunca é sobrescrito. O painel mostra um selo
// "Demonstração" enquanto o modo estiver ligado.
type Campo =
  | 'temperatura' | 'umidade_solo' | 'umidade_ar' | 'luminosidade'
  | 'nivel_reservatorio' | 'nivel_caixa_elevada' | 'velocidade_vento';

const CAMPOS: Campo[] = [
  'temperatura', 'umidade_solo', 'umidade_ar', 'luminosidade',
  'nivel_reservatorio', 'nivel_caixa_elevada', 'velocidade_vento',
];

function simular(campo: Campo, quando: Date): number {
  const horaLocal = (quando.getUTCHours() - 3 + quando.getUTCMinutes() / 60 + 24) % 24; // UTC-3
  const dia = Math.max(0, Math.sin(((horaLocal - 6) / 12) * Math.PI)); // 0 às 6h/18h, 1 ao meio-dia
  const oscila = (semente: number) => Math.sin(quando.getTime() / 420000 + semente);
  const r1 = (n: number) => Math.round(n * 10) / 10;

  switch (campo) {
    case 'temperatura':         return r1(24 + 8 * dia + 0.6 * oscila(1));   // ~24–32 °C
    case 'umidade_ar':          return Math.round(72 - 24 * dia + 3 * oscila(2)); // ~48–72 %
    case 'umidade_solo':        return Math.round(62 - 3 * dia + 4 * oscila(3));  // ~55–66 %
    case 'luminosidade':        return Math.round(100 * Math.pow(dia, 0.8));      // 0–100 %
    case 'nivel_reservatorio':  return Math.round(72 + 5 * oscila(4));
    case 'nivel_caixa_elevada': return Math.round(85 + 6 * oscila(5));
    case 'velocidade_vento':    return Math.round(12 + 5 * dia + 3 * oscila(6)); // km/h
  }
}

function completar(l: Leitura, quando: Date): Leitura {
  const copia: Leitura = { ...l };
  for (const c of CAMPOS) {
    if (copia[c] === null || copia[c] === undefined) (copia as any)[c] = simular(c, quando);
  }
  return copia;
}

export function aplicarDemo(historico: Leitura[]): Leitura[] {
  const agora = Date.now();
  const n = historico.length;
  if (n === 0) {
    // Sem nenhuma leitura ainda: cria 12 pontos (um a cada 5 min) para os gráficos.
    return Array.from({ length: 12 }, (_, i) => {
      const quando = new Date(agora - (11 - i) * 5 * 60000);
      return completar({
        id: -(i + 1), criado_em: quando.toISOString(), temperatura: null, umidade_solo: null,
        umidade_ar: null, luminosidade: null, nivel_reservatorio: null,
        nivel_caixa_elevada: null, velocidade_vento: null,
      }, quando);
    });
  }
  return historico.map((l) => completar(l, new Date(l.criado_em)));
}
