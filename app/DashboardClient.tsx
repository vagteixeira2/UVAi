'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Home, Warehouse, Radio, Settings, LineChartIcon, SlidersHorizontal, ChevronRight,
  Thermometer, Droplet, Sun, Container, Cylinder, Wind, Bell, Zap, ArrowUp, ArrowDown, ArrowRight,
  Leaf, Sprout, Flower2, Grape, Database, Clock, Cpu, Wifi, BatteryMedium, Target, CircleCheck, TriangleAlert,
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { Leitura, StatusAtual, Alerta, Configuracao, Comando } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { THEMES, getPeriod, greetingFor, regionMinutes, TZ, ThemeKey } from '@/lib/timeTheme';

type Props = {
  leitura: Leitura | null;
  historico: Leitura[];
  status: StatusAtual | null;
  alertas: Alerta[];
  config: Configuracao[];
  comandosPendentes: Comando[];
  demo?: boolean;
};

function fmt(v: number | null | undefined, unit: string) {
  return v === null || v === undefined ? '—' : `${v}${unit}`;
}

function series(historico: Leitura[], key: keyof Leitura) {
  return historico.map((h, i) => ({ i, v: (h[key] as number) ?? null })).filter((p) => p.v !== null);
}

function Sparkline({ data, color }: { data: { i: number; v: number | null }[]; color: string }) {
  if (data.length < 2) {
    return <div style={{ height: 28, fontSize: 10.5, color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>Aguardando histórico…</div>;
  }
  return (
    <div style={{ height: 28, width: '100%' }}>
      <ResponsiveContainer width="99%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, footer, color, spark }: {
  icon: any; label: string; value: string; unit: string; footer?: string; color: string;
  spark: { i: number; v: number | null }[];
}) {
  return (
    <div className="metric-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div className="metric-icon" style={{ color, background: `${color}18`, borderColor: `${color}33` }}>
          <Icon size={18} strokeWidth={1.6} />
        </div>
        <div style={{ fontSize: 12.5, paddingTop: 2 }}>{label}</div>
      </div>
      <div style={{ marginTop: 10, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500 }}>
        {value}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 3, color: 'var(--muted)' }}>{unit}</span>
      </div>
      <div style={{ marginTop: 6 }}><Sparkline data={spark} color={color} /></div>
      {footer && <div style={{ marginTop: 4, fontSize: 10.5, color: 'var(--muted)', textAlign: 'right' }}>{footer}</div>}
    </div>
  );
}

export default function DashboardClient({ leitura, historico, status, alertas, config, comandosPendentes, demo }: Props) {
  const router = useRouter();
  const [periodKey, setPeriodKey] = useState<ThemeKey>('tarde');
  const [clock, setClock] = useState('');
  const [greeting, setGreeting] = useState('Bom dia');
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  const [bootMsg, setBootMsg] = useState('');
  const [aba, setAba] = useState<'geral' | 'energia'>('geral');

  function iniciarSistema() {
    const etapas = [
      'Conectando ao Supabase…',
      'Sincronizando sensores…',
      'Verificando atuadores…',
      'Sistema pronto.',
    ];
    let i = 0;
    setBootMsg(etapas[0]);
    const id = setInterval(() => {
      i++;
      if (i < etapas.length) {
        setBootMsg(etapas[i]);
      } else {
        clearInterval(id);
        setTimeout(() => setBooted(true), 450);
      }
    }, 550);
  }

  async function sair() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function acionar(alvo: 'bomba' | 'valvula' | 'ventilador' | 'led' | 'porta', ligadoAtual: boolean) {
    setEnviando(alvo);
    try {
      await fetch('/api/comandos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alvo, ligado: !ligadoAtual }),
      });
      router.refresh();
    } finally {
      setEnviando(null);
    }
  }

  function pendente(alvo: string) {
    return comandosPendentes.find((c) => c.alvo === alvo);
  }

  useEffect(() => {
    function tick() {
      const now = new Date();
      const mins = regionMinutes(now);
      setPeriodKey(getPeriod(mins));
      setGreeting(greetingFor(mins));
      setClock(
        now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ }) +
        ' · ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
      );
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const t = THEMES[periodKey];
  const vars = {
    '--bg': t.bg, '--panel': t.panel, '--card': t.card, '--border': t.border,
    '--text': t.text, '--muted': t.muted, '--accent': t.accent,
  } as React.CSSProperties;

  const cfg = (chave: string) => config.find((c) => c.chave === chave)?.valor;
  const criticalAlert = alertas.find((a) => a.nivel === 'crit');
  const warnAlert = alertas.find((a) => a.nivel === 'warn');
  const bannerAlert = criticalAlert ?? warnAlert;
  const reservatorioBaixo = (leitura?.nivel_reservatorio ?? 100) < 25;

  const spTemp = useMemo(() => series(historico, 'temperatura'), [historico]);
  const spSolo = useMemo(() => series(historico, 'umidade_solo'), [historico]);
  const spLum = useMemo(() => series(historico, 'luminosidade'), [historico]);
  const spReserv = useMemo(() => series(historico, 'nivel_reservatorio'), [historico]);
  const spCaixa = useMemo(() => series(historico, 'nivel_caixa_elevada'), [historico]);
  const spVento = useMemo(() => series(historico, 'velocidade_vento'), [historico]);

  const NAV = [
    { label: 'Visão Geral', Icon: Home, id: 'geral' as const },
    { label: 'Estufa', Icon: Warehouse },
    { label: 'Sensores', Icon: Radio },
    { label: 'Atuadores', Icon: Settings },
    { label: 'Potencial Energético', Icon: Zap, id: 'energia' as const },
    { label: 'Histórico', Icon: LineChartIcon },
    { label: 'Configurações', Icon: SlidersHorizontal },
  ];


  const POTENCIA_IDEAL_W = 50;
  const ENERGIA_META_WH = 320;
  const potenciaHoje = [
    { h: '06h', w: 3.1 }, { h: '07h', w: 9.8 }, { h: '08h', w: 18.4 }, { h: '09h', w: 27.9 },
    { h: '10h', w: 36.2 }, { h: '11h', w: 44.5 }, { h: '12h', w: 48.1 }, { h: '13h', w: 46.3 }, { h: '14h', w: 42.7 },
  ];
  const energiaSemana = [
    { d: 'Qui', wh: 334 }, { d: 'Sex', wh: 298 }, { d: 'Sáb', wh: 341 }, { d: 'Dom', wh: 352 },
    { d: 'Seg', wh: 247 }, { d: 'Ter', wh: 318 }, { d: 'Qua', wh: 337 },
  ];
  const POTENCIA_PLACA_W = potenciaHoje[potenciaHoje.length - 1].w;
  const pctIdeal = Math.round((POTENCIA_PLACA_W / POTENCIA_IDEAL_W) * 100);
  const potenciaBoa = pctIdeal >= 80;
  const corStatus = potenciaBoa ? t.accent : t.amber;
  // Rótulo da linha de referência: fica acima da linha, no canto direito, com fundo para não ser coberto
  const rotuloReferencia = (texto: string) => ({ viewBox }: any) => {
    const largura = texto.length * 6.4 + 12;
    const x = viewBox.x + viewBox.width - largura - 2;
    const y = viewBox.y - 22;
    return (
      <g>
        <rect x={x} y={y} width={largura} height={18} rx={5} fill={t.panel} stroke={t.blue} strokeOpacity={0.5} />
        <text x={x + largura / 2} y={y + 12.5} textAnchor="middle" fontSize={11} fontWeight={600} fill={t.blue}>{texto}</text>
      </g>
    );
  };
  const tooltipStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 12, color: t.text };

  // Consumo mockado (W por hora) — painel exibido na Visão Geral e na aba Potencial Energético
  const consumoHoras = [60,52,58,64,72,80,76,88,95,84,90,78,70,66,74,62,68,58,64,55]
    .map((w, i) => ({ h: `${String(i + 4).padStart(2, '0')}h`, w }));
  const consumoAtual = consumoHoras[consumoHoras.length - 1].w;
  const consumoPico = consumoHoras.reduce((m, p) => (p.w > m.w ? p : m));
  const consumoMedia = Math.round(consumoHoras.reduce((s, p) => s + p.w, 0) / consumoHoras.length);
  const consumoTotalWh = consumoHoras.reduce((s, p) => s + p.w, 0);

  const painelConsumo = (altura: number) => (
    <div className="panel" style={{ background: t.panel, borderColor: t.border }}>
      <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={15} style={{ color: t.accent }} /> Consumo de Energia (W)</h2>
      <div className="consumo-stats">
        {[
          { label: 'Agora', value: `${consumoAtual} W` },
          { label: 'Média', value: `${consumoMedia} W` },
          { label: `Pico (${consumoPico.h})`, value: `${consumoPico.w} W` },
          { label: 'Total no período', value: `${(consumoTotalWh / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kWh` },
        ].map((st) => (
          <div key={st.label}>
            <div style={{ fontSize: 10.5, color: t.muted }}>{st.label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{st.value}</div>
          </div>
        ))}
      </div>
      <div style={{ height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={consumoHoras} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs><linearGradient id="egrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.accent} stopOpacity={0.35}/><stop offset="100%" stopColor={t.accent} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis dataKey="h" tick={{ fontSize: 10.5, fill: t.muted }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
            <YAxis domain={[0, 120]} ticks={[0, 40, 80, 120]} tick={{ fontSize: 10.5, fill: t.muted }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: t.muted, strokeDasharray: '3 3' }} formatter={(v: number) => [`${v} W`, 'Consumo']} />
            <Area type="monotone" dataKey="w" stroke={t.accent} strokeWidth={2} fill="url(#egrad)" activeDot={{ r: 4 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 10.5, color: t.muted, marginTop: 6 }}>Estimativa ilustrativa — sensor de potência ainda não integrado</div>
    </div>
  );

  return (
    <div style={{ ...vars, background: t.bg, color: t.text, minHeight: '100vh', transition: 'background-color 1s, color 1s' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: t.glow, transition: 'background 1s' }} />

      {!booted && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,10,8,0.55)', backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            width: '100%', maxWidth: 340, textAlign: 'center', padding: 32, borderRadius: 20,
            border: `1px solid ${t.border}`, background: t.panel, backdropFilter: 'blur(16px)',
          }}>
            <img src="/brand/icon.png" alt="Uvaí" style={{ width: 48, height: 48, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, marginBottom: 6 }}>Sistema em standby</div>
            {bootMsg ? (
              <div style={{ fontSize: 13, color: t.accent, minHeight: 20 }}>{bootMsg}</div>
            ) : (
              <>
                <div style={{ fontSize: 12.5, color: t.muted, marginBottom: 18 }}>Clique para iniciar o painel da Estufa 01.</div>
                <button onClick={iniciarSistema} style={{
                  padding: '11px 22px', borderRadius: 10, border: 'none', background: t.accent,
                  color: t.dark ? '#0A140E' : '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
                }}>Iniciar Sistema</button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="uvai-root" style={{ filter: booted ? 'none' : 'blur(6px)', transition: 'filter .6s ease', pointerEvents: booted ? 'auto' : 'none' }}>
        <aside className="sidebar" style={{ background: t.panel, borderColor: t.border }}>
          <div>
            <div className="brand">
              <img src="/brand/icon.png" alt="Uvaí" style={{ width: 34, height: 34, objectFit: 'contain' }} />
              <div>
                <div className="brand-name">UVAÍ</div>
                <div className="brand-sub">TECNOLOGIA PARA VINHEDOS</div>
              </div>
            </div>
            <nav className="side-nav">
              {NAV.map(({ label, Icon, id }) => {
                const ativo = id === aba;
                return (
                  <a key={label} onClick={id ? () => setAba(id) : undefined} style={ativo ? { background: t.accentSoft, color: t.text, borderColor: t.border } : { color: t.muted }}>
                    <Icon size={17} strokeWidth={1.6} style={ativo ? { color: t.accent } : undefined} /> {label}
                  </a>
                );
              })}
            </nav>
          </div>
          <div>
            <div className="weather-card" style={{ borderColor: t.border, background: t.card }}>
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 500, fontSize: 12.5, marginBottom: 6 }}>Serra de São Bento - RN</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: t.muted }}>
                  <span>{t.icon}</span><span style={{ fontWeight: 500, color: t.text }}>{t.weather.temp}</span><span>{t.weather.desc}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: t.muted }}>
                  Condições externas <ChevronRight size={13} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: 10.5, color: t.muted, lineHeight: 1.6 }}>UVAÍ © 2026<br />Vinhedos Inteligentes</div>
            <button onClick={sair} style={{ marginTop: 10, background: 'none', border: 'none', padding: 0, fontSize: 11, color: t.muted, cursor: 'pointer', textDecoration: 'underline' }}>Sair</button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar" style={{ background: t.panel, borderColor: t.border }}>
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 500 }}>{greeting}, Equipe Uvaí</h1>
              <p style={{ fontSize: 13, color: t.muted, marginTop: 3 }}>
                {leitura ? 'Tudo funcionando normalmente na estufa.' : 'Aguardando a primeira leitura do ESP32.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: leitura ? t.accent : t.muted }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: leitura ? t.accent : t.muted }} />
                {leitura ? 'Sistema Online' : 'Sem dados ainda'}
              </span>
              <span style={{ color: t.muted }}>{clock}</span>
              <div style={{ position: 'relative' }}><Bell size={16} style={{ color: t.muted }} /></div>
              <div style={{ width: 32, height: 32, borderRadius: 99, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, border: `1px solid ${t.border}`, background: t.card }}>UV</div>
            </div>
          </header>

          {aba === 'energia' ? (<>
            <section className="panel" style={{ background: t.panel, borderColor: t.border, marginBottom: 16 }}>
              <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={15} style={{ color: t.accent }} /> Potencial Energético</h2>
              <div className="metric-grid">
                <div className="metric-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div className="metric-icon" style={{ color: t.amber, background: `${t.amber}18`, borderColor: `${t.amber}33` }}>
                      <Sun size={18} strokeWidth={1.6} />
                    </div>
                    <div style={{ fontSize: 12.5, paddingTop: 2 }}>Potência atual da placa</div>
                  </div>
                  <div style={{ marginTop: 10, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500 }}>
                    {POTENCIA_PLACA_W.toLocaleString('pt-BR')}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 3, color: 'var(--muted)' }}>W</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10.5, color: 'var(--muted)', textAlign: 'right' }}>{pctIdeal}% do ideal</div>
                </div>

                <div className="metric-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div className="metric-icon" style={{ color: t.blue, background: `${t.blue}18`, borderColor: `${t.blue}33` }}>
                      <Target size={18} strokeWidth={1.6} />
                    </div>
                    <div style={{ fontSize: 12.5, paddingTop: 2 }}>Potência ideal</div>
                  </div>
                  <div style={{ marginTop: 10, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500 }}>
                    {POTENCIA_IDEAL_W}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 3, color: 'var(--muted)' }}>W</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10.5, color: 'var(--muted)', textAlign: 'right' }}>Meta diária: {ENERGIA_META_WH} Wh</div>
                </div>

                <div className="metric-card" style={{ borderColor: `${corStatus}55` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div className="metric-icon" style={{ color: corStatus, background: `${corStatus}18`, borderColor: `${corStatus}33` }}>
                      {potenciaBoa ? <CircleCheck size={18} strokeWidth={1.6} /> : <TriangleAlert size={18} strokeWidth={1.6} />}
                    </div>
                    <div style={{ fontSize: 12.5, paddingTop: 2 }}>Status da potência</div>
                  </div>
                  <div style={{ marginTop: 10, fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500 }}>
                    {potenciaBoa ? 'Bom' : 'Precisa de atenção'}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)', lineHeight: 1.45 }}>
                    {potenciaBoa
                      ? 'A placa está gerando dentro do esperado.'
                      : 'Geração abaixo de 80% do ideal. Verifique sujeira, sombra ou conexões da placa.'}
                  </div>
                </div>
              </div>
            </section>

            <section className="row-energia">
              <div className="panel" style={{ background: t.panel, borderColor: t.border }}>
                <h2 className="panel-title">Potência ao longo do dia (W)</h2>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={potenciaHoje} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                      <defs><linearGradient id="pgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.accent} stopOpacity={0.3}/><stop offset="100%" stopColor={t.accent} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid stroke={t.grid} vertical={false} />
                      <XAxis dataKey="h" tick={{ fontSize: 11, fill: t.muted }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 70]} ticks={[0, 20, 40, 60]} tick={{ fontSize: 11, fill: t.muted }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: t.muted, strokeDasharray: '3 3' }} formatter={(v: number) => [`${v.toLocaleString('pt-BR')} W`, 'Potência']} />
                      <Area type="monotone" dataKey="w" stroke={t.accent} strokeWidth={2} fill="url(#pgrad)" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                      <ReferenceLine y={POTENCIA_IDEAL_W} stroke={t.blue} strokeWidth={1.5} strokeDasharray="5 4" label={rotuloReferencia(`Ideal ${POTENCIA_IDEAL_W} W`)} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel" style={{ background: t.panel, borderColor: t.border }}>
                <h2 className="panel-title">Energia gerada — últimos 7 dias (Wh)</h2>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={energiaSemana} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke={t.grid} vertical={false} />
                      <XAxis dataKey="d" tick={{ fontSize: 11, fill: t.muted }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 450]} ticks={[0, 100, 200, 300, 400]} tick={{ fontSize: 11, fill: t.muted }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: t.accentSoft }} formatter={(v: number) => [`${v} Wh`, 'Energia']} />
                      <Bar dataKey="wh" fill={t.accent} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                      <ReferenceLine y={ENERGIA_META_WH} stroke={t.blue} strokeWidth={1.5} strokeDasharray="5 4" label={rotuloReferencia(`Meta ${ENERGIA_META_WH} Wh`)} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section style={{ marginTop: 16 }}>
              {painelConsumo(240)}
            </section>
          </>) : (<>
          {bannerAlert && (
            <div className="banner" style={{ borderColor: t.border, background: t.card, borderLeftColor: bannerAlert.nivel === 'crit' ? '#f0687e' : t.amber }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, marginTop: 5, background: bannerAlert.nivel === 'crit' ? '#f0687e' : t.amber, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{bannerAlert.titulo}</div>
                <div style={{ fontSize: 12.5, color: t.muted, marginTop: 3 }}>{bannerAlert.descricao}</div>
              </div>
            </div>
          )}

          <section className="row-top">
            <div className="panel" style={{ background: t.panel, borderColor: t.border }}>
              <h2 className="panel-title">Condições Atuais da Estufa</h2>
              <div className="metric-grid">
                <MetricCard icon={Thermometer} label="Temperatura" value={fmt(leitura?.temperatura, '')} unit="°C" color={t.accent} spark={spTemp} footer={cfg('temp_maxima') ? `Máx: ${cfg('temp_maxima')}°C` : undefined} />
                <MetricCard icon={Droplet} label="Umidade do Solo" value={fmt(leitura?.umidade_solo, '')} unit="%" color={t.blue} spark={spSolo} footer={cfg('umidade_minima') ? `Mín: ${cfg('umidade_minima')}%` : undefined} />
                <MetricCard icon={Sun} label="Luminosidade" value={fmt(leitura?.luminosidade, '')} unit="%" color={t.purple} spark={spLum} />
                <MetricCard icon={Container} label="Nível do Reservatório" value={fmt(leitura?.nivel_reservatorio, '')} unit="%" color={reservatorioBaixo ? '#f0ad5c' : t.blue} spark={spReserv} footer="Capacidade: 1.000 L" />
                <MetricCard icon={Cylinder} label="Caixa Elevada" value={fmt(leitura?.nivel_caixa_elevada, '')} unit="%" color={t.blue} spark={spCaixa} footer="Capacidade: 500 L" />
                <MetricCard icon={Wind} label="Vento" value={fmt(leitura?.velocidade_vento, '')} unit="km/h" color={t.text} spark={spVento} footer="Limite: 40 km/h" />
              </div>
            </div>

            <div className="hero-card" style={{ borderColor: t.border }}>
              <img src={t.hero} alt="Estufa 01" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.55) 100%)' }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: 20, color: '#fff' }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, color: '#7EEBB0' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: '#7EEBB0' }} /> {status ? 'Operando' : 'Aguardando status'}
                  </div>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 21, marginTop: 6 }}>Estufa 01</h3>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>Serra de São Bento · RN</div>
                </div>
                <p style={{ fontSize: 12, opacity: 0.85, maxWidth: 220, lineHeight: 1.5 }}>Ambiente controlado para máximo desenvolvimento das uvas.</p>
              </div>
            </div>
          </section>

          <section className="row-mid">
            <div className="panel" style={{ background: t.panel, borderColor: t.border }}>
              <h2 className="panel-title">Status dos Atuadores</h2>
              {status ? (
                <div>
                  {[
                    { alvo: 'bomba' as const, name: 'Bomba de Irrigação', on: status.bomba, onTxt: 'ATIVA', offTxt: 'DESLIGADA' },
                    { alvo: 'valvula' as const, name: 'Válvula de Gotejamento', on: status.valvula_aberta_pct > 0, onTxt: 'ABERTA', offTxt: 'FECHADA' },
                    { alvo: 'ventilador' as const, name: 'Ventilador', on: status.ventilador, onTxt: 'LIGADO', offTxt: 'DESLIGADO' },
                    { alvo: 'led' as const, name: 'LED (Fotoperíodo)', on: status.led, onTxt: 'LIGADO', offTxt: 'DESLIGADO' },
                    { alvo: 'porta' as const, name: 'Porta da Estufa', on: !!status.porta, onTxt: 'ABERTA', offTxt: 'FECHADA' },
                  ].map((a) => {
                    const pend = pendente(a.alvo);
                    const busy = enviando === a.alvo || !!pend;
                    return (
                      <div key={a.name} className="actuator-row" style={{ borderColor: t.border }}>
                        <div>
                          <div style={{ fontSize: 13 }}>{a.name}</div>
                          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.4, marginTop: 2, color: pend ? t.amber : (a.on ? t.accent : t.muted) }}>
                            {pend ? `Aguardando ESP32 (${pend.ligado ? 'ligar' : 'desligar'})…` : (a.on ? a.onTxt : a.offTxt)}
                          </div>
                        </div>
                        <button
                          className={`switch ${a.on ? 'on' : 'off'}`}
                          style={{ background: a.on ? t.accent : t.border, opacity: busy ? 0.6 : 1, cursor: busy ? 'wait' : 'pointer', border: 'none' }}
                          disabled={busy}
                          onClick={() => acionar(a.alvo, a.on)}
                        ><i /></button>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="empty">Nenhum status registrado ainda.</div>}
            </div>

            {painelConsumo(120)}

            <div className="panel" style={{ background: t.panel, borderColor: t.border }}>
              <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={15} /> Alertas e Eventos <span style={{ marginLeft: 'auto', fontSize: 11, color: t.muted, fontWeight: 400 }}>{alertas.length} ativos</span></h2>
              {alertas.length === 0 ? <div className="empty">Nenhum alerta ativo agora.</div> : (
                <>
                  {(showAllAlerts ? alertas : alertas.slice(0, 5)).map((a) => (
                    <div key={a.id} className="alert-row" style={{ borderColor: t.border }}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, marginTop: 5, flexShrink: 0, background: a.nivel === 'crit' ? '#f0687e' : a.nivel === 'warn' ? t.amber : a.nivel === 'info' ? t.blue : t.accent }} />
                      <div>
                        <div style={{ fontSize: 12.5 }}>{a.titulo}</div>
                        <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{a.descricao}</div>
                      </div>
                    </div>
                  ))}
                  {alertas.length > 5 && (
                    <button onClick={() => setShowAllAlerts(!showAllAlerts)} style={{ background: 'none', border: 'none', color: t.muted, fontSize: 11, marginTop: 8, cursor: 'pointer' }}>
                      {showAllAlerts ? 'Ver menos' : 'Ver todos'}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="row-bottom">
            <div className="panel" style={{ background: t.panel, borderColor: t.border }}>
              <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Leaf size={15} style={{ color: t.accent }} /> Crescimento das Plantas</h2>
              <div className="stage-grid">
                {[
                  { label: 'Germinação', days: 'Dia 1–7', Icon: Sprout, pct: 100, color: t.accent },
                  { label: 'Desenvolvimento', days: 'Dia 8–20', Icon: Leaf, pct: 45, color: t.accent },
                  { label: 'Floração', days: 'Dia 21–35', Icon: Flower2, pct: 10, color: t.purple },
                  { label: 'Frutificação', days: 'Dia 36+', Icon: Grape, pct: 0, color: t.purple },
                ].map((s) => (
                  <div key={s.label} className="stage" style={{ borderColor: t.border, background: t.card }}>
                    <s.Icon size={20} strokeWidth={1.4} style={{ color: s.color, margin: '0 auto' }} />
                    <div style={{ fontSize: 11, marginTop: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: t.muted }}>{s.days}</div>
                    <div className="bar" style={{ background: t.border }}><i style={{ width: `${s.pct}%`, background: s.color }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ background: t.panel, borderColor: t.border }}>
              <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Database size={15} /> Dados do Sistema</h2>
              {[
                { Icon: Clock, label: 'Última leitura', value: leitura ? new Date(leitura.criado_em).toLocaleString('pt-BR', { timeZone: TZ }) : '—' },
                { Icon: Cpu, label: 'ESP32', value: leitura ? 'Conectado' : 'Aguardando' },
                { Icon: Wifi, label: 'Wi-Fi', value: leitura ? 'Sinal forte' : '—' },
              ].map((r) => (
                <div key={r.label} className="sys-row" style={{ borderColor: t.border }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.muted }}><r.Icon size={14} /> {r.label}</span>
                  <span style={{ color: r.value === '—' ? t.muted : t.accent }}>{r.value}</span>
                </div>
              ))}
            </div>
          </section>
          </>)}

          <footer style={{ textAlign: 'center', marginTop: 26, fontSize: 11, color: t.muted }}>
            Uvaí · Estufa inteligente para vinícola — Projeto PEITD, BTI/IMD/UFRN
          </footer>
        </main>
      </div>
    </div>
  );
}
