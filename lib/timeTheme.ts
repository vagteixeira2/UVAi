export const TZ = 'America/Fortaleza'; // mesmo fuso de Natal - RN

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
    glow: glow('#f6b98f', '#c4a1ff'), weather: { temp: '20°C', desc: 'Amanhecendo' },
  },
  fimDaManha: {
    label: 'Fim da manhã', icon: '🌤️', dark: false, hero: '/greenhouse/fim-da-manha.jpg',
    bg: '#eef4f0', panel: 'rgba(255,255,255,0.82)', card: 'rgba(244,249,246,0.95)',
    border: 'rgba(15,60,45,0.09)', text: '#0f2620', muted: '#5f7771',
    accent: '#0e9f73', accentSoft: 'rgba(14,159,115,0.10)',
    purple: '#8b5cf6', blue: '#2b8fe0', amber: '#e39a12', grid: 'rgba(15,38,32,0.07)',
    glow: glow('#7dd3fc', '#0e9f73'), weather: { temp: '25°C', desc: 'Céu limpo' },
  },
  tarde: {
    label: 'Tarde', icon: '☀️', dark: false, hero: '/greenhouse/tarde.jpg',
    bg: '#f2f0e6', panel: 'rgba(255,253,246,0.85)', card: 'rgba(250,247,238,0.95)',
    border: 'rgba(90,70,20,0.10)', text: '#26200f', muted: '#7a715a',
    accent: '#c98a12', accentSoft: 'rgba(201,138,18,0.12)',
    purple: '#8b5cf6', blue: '#2b8fe0', amber: '#c98a12', grid: 'rgba(38,32,15,0.07)',
    glow: glow('#ffd27d', '#0e9f73'), weather: { temp: '29°C', desc: 'Ensolarado' },
  },
  fimDaTarde: {
    label: 'Fim de tarde', icon: '🌇', dark: true, hero: '/greenhouse/fim-da-tarde.jpg',
    bg: '#140d0a', panel: 'rgba(34,22,17,0.74)', card: 'rgba(48,32,24,0.55)',
    border: 'rgba(255,176,102,0.13)', text: '#f7ede4', muted: '#a8958a',
    accent: '#ffab5c', accentSoft: 'rgba(255,171,92,0.13)',
    purple: '#c89bff', blue: '#6fb8ff', amber: '#ffd166', grid: 'rgba(255,255,255,0.07)',
    glow: glow('#ffab5c', '#c89bff'), weather: { temp: '24°C', desc: 'Entardecer' },
  },
  noite: {
    label: 'Noite', icon: '🌙', dark: true, hero: '/greenhouse/noite.jpg',
    bg: '#060e10', panel: 'rgba(10,24,26,0.72)', card: 'rgba(16,34,37,0.55)',
    border: 'rgba(94,190,234,0.10)', text: '#e7f0f3', muted: '#7d8f98',
    accent: '#4fb3ff', accentSoft: 'rgba(79,179,255,0.12)',
    purple: '#b28cff', blue: '#4fb3ff', amber: '#f5b84a', grid: 'rgba(255,255,255,0.06)',
    glow: glow('#4fb3ff', '#b28cff'), weather: { temp: '19°C', desc: 'Céu limpo' },
  },
};

export function regionHour(d: Date) {
  return Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ }).format(d)) % 24;
}

export function getPeriod(h: number): ThemeKey {
  if (h >= 5 && h < 8) return 'manha';
  if (h >= 8 && h < 12) return 'fimDaManha';
  if (h >= 12 && h < 17) return 'tarde';
  if (h >= 17 && h < 19) return 'fimDaTarde';
  if (h >= 19 && h < 23) return 'noite';
  return 'fimDeNoite';
}

export function greetingFor(h: number) {
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
