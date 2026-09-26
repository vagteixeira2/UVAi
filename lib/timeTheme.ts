export const TZ = 'America/Fortaleza'; // mesmo fuso de Natal - RN

const glow = (a: string, b: string) =>
  `radial-gradient(900px 500px at 85% -10%, ${a}26, transparent 60%), radial-gradient(700px 500px at 0% 100%, ${b}1f, transparent 60%)`;

export type ThemeKey = 'night' | 'dawn' | 'day' | 'dusk';

export const THEMES: Record<ThemeKey, {
  label: string; icon: string; dark: boolean;
  bg: string; panel: string; card: string; border: string; text: string; muted: string;
  accent: string; accentSoft: string; purple: string; blue: string; amber: string; grid: string;
  glow: string; weather: { temp: string; desc: string };
}> = {
  night: {
    label: 'Noite', icon: '🌙', dark: true,
    bg: '#050f0e', panel: 'rgba(10,26,24,0.72)', card: 'rgba(16,36,33,0.55)',
    border: 'rgba(94,234,190,0.10)', text: '#e7f3ef', muted: '#7d9892',
    accent: '#2fd5a2', accentSoft: 'rgba(47,213,162,0.12)',
    purple: '#b28cff', blue: '#4fb3ff', amber: '#f5b84a', grid: 'rgba(255,255,255,0.06)',
    glow: glow('#2fd5a2', '#b28cff'), weather: { temp: '19°C', desc: 'Céu limpo' },
  },
  dawn: {
    label: 'Amanhecer', icon: '🌅', dark: true,
    bg: '#130f1c', panel: 'rgba(30,22,42,0.72)', card: 'rgba(44,32,60,0.55)',
    border: 'rgba(244,169,190,0.14)', text: '#f4ecf6', muted: '#a393ad',
    accent: '#f6a38f', accentSoft: 'rgba(246,163,143,0.14)',
    purple: '#c4a1ff', blue: '#7cc4ff', amber: '#ffcf7a', grid: 'rgba(255,255,255,0.07)',
    glow: glow('#f6a38f', '#c4a1ff'), weather: { temp: '20°C', desc: 'Amanhecendo' },
  },
  day: {
    label: 'Dia', icon: '☀️', dark: false,
    bg: '#eef4f0', panel: 'rgba(255,255,255,0.82)', card: 'rgba(244,249,246,0.95)',
    border: 'rgba(15,60,45,0.09)', text: '#0f2620', muted: '#5f7771',
    accent: '#0e9f73', accentSoft: 'rgba(14,159,115,0.10)',
    purple: '#8b5cf6', blue: '#2b8fe0', amber: '#e39a12', grid: 'rgba(15,38,32,0.07)',
    glow: glow('#7dd3fc', '#0e9f73'), weather: { temp: '28°C', desc: 'Ensolarado' },
  },
  dusk: {
    label: 'Entardecer', icon: '🌇', dark: true,
    bg: '#140d0a', panel: 'rgba(34,22,17,0.74)', card: 'rgba(48,32,24,0.55)',
    border: 'rgba(255,176,102,0.13)', text: '#f7ede4', muted: '#a8958a',
    accent: '#ffab5c', accentSoft: 'rgba(255,171,92,0.13)',
    purple: '#c89bff', blue: '#6fb8ff', amber: '#ffd166', grid: 'rgba(255,255,255,0.07)',
    glow: glow('#ffab5c', '#c89bff'), weather: { temp: '24°C', desc: 'Entardecer' },
  },
};

export function regionHour(d: Date) {
  return Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ }).format(d)) % 24;
}

export function getPeriod(h: number): ThemeKey {
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}

export function greetingFor(h: number) {
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
