// Fuso e dados solares de Natal - RN (5°47'S, muito perto da linha do Equador).
// Por estar quase no Equador, a duração do dia varia pouquíssimo no ano todo
// (~11h49 no solstício de junho a ~12h29 no de dezembro), então um horário
// fixo o ano inteiro já é uma aproximação muito boa — nascer do sol ~04:56–05:35,
// pôr do sol ~17:13–17:43 (fontes: dados solares de Natal/RN, INMET/Embrapa e
// calendriersolaire.com). Usamos a média: nascer ~05:15, pôr ~17:20, com
// crepúsculo civil de ~20–25min de cada lado.
export const TZ = 'America/Fortaleza'; // mesmo fuso horário de Natal - RN

const glow = (a: string, b: string) =>
  `radial-gradient(900px 500px at 85% -10%, ${a}26, transparent 60%), radial-gradient(700px 500px at 0% 100%, ${b}1f, transparent 60%)`;

export type ThemeKey = 'manha' | 'fimDaManha' | 'tarde' | 'fimDaTarde' | 'noite' | 'fimDeNoite';

export const THEMES: Record<ThemeKey, {
  label: string; icon: string; dark: boolean; hero: string;
  bg: string; panel: string; card: string; border: string; text: string; muted: string;
  accent: string; accentSoft: string; purple: string; blue: string; amber: string; grid: string;
  glow: string; weather: { temp: string; desc: string };
}> = {
  fimDeNoite: {
    label: 'Fim de noite', icon: '🌌', dark: true, hero: '/greenhouse/fim-de-noite.jpg',
    bg: '#050f0e', panel: 'rgba(10,26,24,0.72)', card: 'rgba(16,36,33,0.55)',
    border: 'rgba(94,234,190,0.10)', text: '#e7f3ef', muted: '#7d9892',
    accent: '#2fd5a2', accentSoft: 'rgba(47,213,162,0.12)',
    purple: '#b28cff', blue: '#4fb3ff', amber: '#f5b84a', grid: 'rgba(255,255,255,0.06)',
    glow: glow('#2fd5a2', '#b28cff'), weather: { temp: '18°C', desc: 'Céu limpo' },
  },
  manha: {
    label: 'Manhã', icon: '🌅', dark: true, hero: '/greenhouse/manha.jpg',
    bg: '#1a1410', panel: 'rgba(40,30,24,0.72)', card: 'rgba(54,40,32,0.55)',
    border: 'rgba(244,190,150,0.14)', text: '#f7ede2', muted: '#ad9c8c',
    accent: '#f6b98f', accentSoft: 'rgba(246,185,143,0.14)',
    purple: '#c4a1ff', blue: '#7cc4ff', amber: '#ffcf7a', grid: 'rgba(255,255,255,0.07)',
    glow: glow('#f6b98f', '#c4a1ff'), weather: { temp: '24°C', desc: 'Amanhecendo' },
  },
  fimDaManha: {
    label: 'Fim da manhã', icon: '🌤️', dark: false, hero: '/greenhouse/fim-da-manha.jpg',
    bg: '#eef4f0', panel: 'rgba(255,255,255,0.82)', card: 'rgba(244,249,246,0.95)',
    border: 'rgba(15,60,45,0.09)', text: '#0f2620', muted: '#5f7771',
    accent: '#0e9f73', accentSoft: 'rgba(14,159,115,0.10)',
    purple: '#8b5cf6', blue: '#2b8fe0', amber: '#e39a12', grid: 'rgba(15,38,32,0.07)',
    glow: glow('#7dd3fc', '#0e9f73'), weather: { temp: '27°C', desc: 'Céu limpo' },
  },
  tarde: {
    label: 'Tarde', icon: '☀️', dark: false, hero: '/greenhouse/tarde.jpg',
    bg: '#f2f0e6', panel: 'rgba(255,253,246,0.85)', card: 'rgba(250,247,238,0.95)',
    border: 'rgba(90,70,20,0.10)', text: '#26200f', muted: '#7a715a',
    accent: '#c98a12', accentSoft: 'rgba(201,138,18,0.12)',
    purple: '#8b5cf6', blue: '#2b8fe0', amber: '#c98a12', grid: 'rgba(38,32,15,0.07)',
    glow: glow('#ffd27d', '#0e9f73'), weather: { temp: '30°C', desc: 'Ensolarado' },
  },
  fimDaTarde: {
    label: 'Fim de tarde', icon: '🌇', dark: true, hero: '/greenhouse/fim-da-tarde.jpg',
    bg: '#140d0a', panel: 'rgba(34,22,17,0.74)', card: 'rgba(48,32,24,0.55)',
    border: 'rgba(255,176,102,0.13)', text: '#f7ede4', muted: '#a8958a',
    accent: '#ffab5c', accentSoft: 'rgba(255,171,92,0.13)',
    purple: '#c89bff', blue: '#6fb8ff', amber: '#ffd166', grid: 'rgba(255,255,255,0.07)',
    glow: glow('#ffab5c', '#c89bff'), weather: { temp: '26°C', desc: 'Entardecer' },
  },
  noite: {
    label: 'Noite', icon: '🌙', dark: true, hero: '/greenhouse/noite.jpg',
    bg: '#060e10', panel: 'rgba(10,24,26,0.72)', card: 'rgba(16,34,37,0.55)',
    border: 'rgba(94,190,234,0.10)', text: '#e7f0f3', muted: '#7d8f98',
    accent: '#4fb3ff', accentSoft: 'rgba(79,179,255,0.12)',
    purple: '#b28cff', blue: '#4fb3ff', amber: '#f5b84a', grid: 'rgba(255,255,255,0.06)',
    glow: glow('#4fb3ff', '#b28cff'), weather: { temp: '22°C', desc: 'Céu limpo' },
  },
};

/** Minutos desde 00:00 no fuso de Natal/RN. */
export function regionMinutes(d: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone: TZ,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

// Limites baseados no nascer (~05:15) e pôr do sol (~17:20) médios de Natal/RN,
// com ~20–25min de crepúsculo civil de cada lado.
const B = {
  manhaIni: 4 * 60 + 50,      // 04:50 — início do crepúsculo civil matutino
  fimDaManhaIni: 7 * 60 + 30, // 07:30 — sol já alto, luz plena
  tardeIni: 12 * 60,          // 12:00
  fimDaTardeIni: 16 * 60 + 30,// 16:30 — luz começa a esquentar de tom
  noiteIni: 17 * 60 + 45,     // 17:45 — fim do crepúsculo civil vespertino
  fimDeNoiteIni: 23 * 60,     // 23:00
};

export function getPeriod(totalMin: number): ThemeKey {
  if (totalMin >= B.manhaIni && totalMin < B.fimDaManhaIni) return 'manha';
  if (totalMin >= B.fimDaManhaIni && totalMin < B.tardeIni) return 'fimDaManha';
  if (totalMin >= B.tardeIni && totalMin < B.fimDaTardeIni) return 'tarde';
  if (totalMin >= B.fimDaTardeIni && totalMin < B.noiteIni) return 'fimDaTarde';
  if (totalMin >= B.noiteIni && totalMin < B.fimDeNoiteIni) return 'noite';
  return 'fimDeNoite'; // 23:00–04:50, atravessa a meia-noite
}

export function greetingFor(totalMin: number) {
  if (totalMin < B.manhaIni) return 'Boa noite';
  if (totalMin < B.tardeIni) return 'Bom dia';
  if (totalMin < B.noiteIni) return 'Boa tarde';
  return 'Boa noite';
}
