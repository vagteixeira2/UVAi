'use client';

import { useEffect, useState } from 'react';
import { Leitura, StatusAtual, Alerta, Configuracao } from '@/lib/supabase';

const PHASES: Record<string, { bg: string; opacity: number; label: string; icon: string; greet: string }> = {
  night: { bg: 'radial-gradient(circle at 50% 0%, rgba(30,20,60,0.5), rgba(5,5,15,0.65))', opacity: 0.55, label: 'Noite', icon: '🌙', greet: 'Boa noite' },
  dawn: { bg: 'radial-gradient(circle at 20% 10%, rgba(240,173,92,0.35), transparent 60%)', opacity: 0.4, label: 'Amanhecer', icon: '🌅', greet: 'Bom dia' },
  day: { bg: 'radial-gradient(circle at 50% 0%, rgba(95,217,140,0.10), transparent 70%)', opacity: 0.22, label: 'Dia', icon: '☀️', greet: 'Bom dia' },
  dusk: { bg: 'radial-gradient(circle at 80% 10%, rgba(167,140,224,0.35), rgba(240,109,92,0.15) 55%, transparent 75%)', opacity: 0.48, label: 'Entardecer', icon: '🌇', greet: 'Boa tarde' },
};

function phaseFor(h: number) {
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

function fmt(v: number | null | undefined, unit: string) {
  return v === null || v === undefined ? '—' : `${v}${unit}`;
}

type Props = {
  leitura: Leitura | null;
  status: StatusAtual | null;
  alertas: Alerta[];
  config: Configuracao[];
};

export default function DashboardClient({ leitura, status, alertas, config }: Props) {
  const [clock, setClock] = useState('');
  const [phaseKey, setPhaseKey] = useState('day');
  const [greeting, setGreeting] = useState('Bom dia, Equipe Uvaí');

  useEffect(() => {
    function tick() {
      const now = new Date();
      const key = phaseFor(now.getHours());
      setPhaseKey(key);
      setClock(now.toLocaleDateString('pt-BR') + ' · ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setGreeting(PHASES[key].greet + ', Equipe Uvaí');
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const phase = PHASES[phaseKey];
  const criticalAlert = alertas.find((a) => a.nivel === 'crit');
  const warnAlert = alertas.find((a) => a.nivel === 'warn');
  const bannerAlert = criticalAlert ?? warnAlert;
  const reservatorioBaixo = (leitura?.nivel_reservatorio ?? 100) < 25;
  const cfg = (chave: string) => config.find((c) => c.chave === chave)?.valor;

  return (
    <div className="app">
      <div id="skyOverlay" style={{ background: phase.bg, opacity: phase.opacity }} />

      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="mark">U</div>
            <div>
              <div className="name">UVAÍ</div>
              <div className="sub">TECNOLOGIA PARA VINHEDOS</div>
            </div>
          </div>
          <nav className="side-nav">
            <a className="active"><span className="ic">⌂</span> Visão Geral</a>
            <a><span className="ic">▦</span> Estufa</a>
            <a><span className="ic">◎</span> Sensores</a>
            <a><span className="ic">⚙</span> Atuadores</a>
            <a><span className="ic">↗</span> Histórico</a>
            <a><span className="ic">☰</span> Configurações</a>
          </nav>
        </div>
        <div className="side-footer">
          <div className="loc-card">
            <div className="place">Serra de São Bento - RN</div>
            <div className="phase">{phase.icon} {phase.label}</div>
          </div>
          <div className="copyright">UVAÍ © 2026<br />Vinhedos Inteligentes</div>
        </div>
      </aside>

      <main className="main">
        <div className="topline">
          <div>
            <div className="greeting">{greeting}</div>
            <div className="sub">
              {leitura ? 'Tudo funcionando normalmente na estufa.' : 'Aguardando a primeira leitura do ESP32.'}
            </div>
          </div>
          <div className="topline-right">
            <div className="status-pill">
              <span className="dot" style={{ background: leitura ? 'var(--grow)' : 'var(--text-faint)' }} />
              {leitura ? 'Sistema Online' : 'Sem dados ainda'}
            </div>
            <div className="clock-chip">{clock}</div>
          </div>
        </div>

        {bannerAlert && (
          <div className={`banner ${bannerAlert.nivel === 'crit' ? 'crit' : ''}`}>
            <span className="b-dot" />
            <div>
              <div className="b-title">{bannerAlert.titulo}</div>
              <div className="b-desc">{bannerAlert.descricao}</div>
            </div>
          </div>
        )}

        <div className="row-top">
          <div className="card">
            <h2>Condições Atuais da Estufa <span className="n">tabela leituras</span></h2>
            <div className="sensor-grid">
              <div className={`sensor ${!leitura ? 'empty' : ''}`}>
                <div className="top"><div className="s-icon" style={{ color: 'var(--grow)' }}>🌡️</div><div className="label">Temperatura</div></div>
                <div className="val">{fmt(leitura?.temperatura, '°C')}</div>
                {cfg('temp_maxima') && <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 5 }}>Máx. configurado: {cfg('temp_maxima')}°C</div>}
              </div>
              <div className={`sensor ${!leitura ? 'empty' : ''}`}>
                <div className="top"><div className="s-icon" style={{ color: 'var(--blue)' }}>💧</div><div className="label">Umidade do Solo</div></div>
                <div className="val">{fmt(leitura?.umidade_solo, '%')}</div>
                {cfg('umidade_minima') && <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 5 }}>Mín. configurado: {cfg('umidade_minima')}%</div>}
              </div>
              <div className={`sensor ${!leitura ? 'empty' : ''}`}>
                <div className="top"><div className="s-icon" style={{ color: 'var(--grape)' }}>☀️</div><div className="label">Luminosidade</div></div>
                <div className="val">{fmt(leitura?.luminosidade, '%')}</div>
              </div>
              <div className={`sensor ${!leitura ? 'empty' : ''} ${reservatorioBaixo ? 'warn' : ''}`}>
                <div className="top"><div className="s-icon" style={{ color: 'var(--blue)' }}>🛢️</div><div className="label">Nível do Reservatório</div></div>
                <div className="val">{fmt(leitura?.nivel_reservatorio, '%')}</div>
              </div>
              <div className={`sensor ${!leitura ? 'empty' : ''}`}>
                <div className="top"><div className="s-icon" style={{ color: 'var(--blue)' }}>🚰</div><div className="label">Caixa Elevada</div></div>
                <div className="val">{fmt(leitura?.nivel_caixa_elevada, '%')}</div>
              </div>
              <div className={`sensor ${!leitura ? 'empty' : ''}`}>
                <div className="top"><div className="s-icon" style={{ color: '#C9D6CF' }}>🍃</div><div className="label">Vento</div></div>
                <div className="val">{fmt(leitura?.velocidade_vento, ' km/h')}</div>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3A2F52" /><stop offset="45%" stopColor="#6B4A5C" /><stop offset="75%" stopColor="#D98A5E" /><stop offset="100%" stopColor="#1A140F" />
                </linearGradient>
              </defs>
              <rect width="400" height="300" fill="url(#skyGrad)" />
              <circle cx="320" cy="70" r="26" fill="#F3C089" opacity="0.85" />
              <path d="M0 210 L60 175 L120 200 L180 165 L240 195 L300 160 L400 190 L400 300 L0 300 Z" fill="#141A12" opacity="0.9" />
              <g stroke="#0C120D" strokeWidth={2} fill="rgba(210,235,220,0.06)">
                <polygon points="70,300 70,190 200,150 330,190 330,300" />
              </g>
            </svg>
            <div className="tag"><span className="dot" /> {status ? 'Operando' : 'Aguardando status'}</div>
            <h3>Estufa 01</h3>
            <div className="loc">Serra de São Bento · RN</div>
            <div className="hero-desc">Ambiente controlado para máximo desenvolvimento das uvas.</div>
          </div>
        </div>

        <div className="row-bottom">
          <div className="card">
            <h2>Status dos Atuadores <span className="n">status_atual</span></h2>
            {status ? (
              <div>
                <div className="actuator"><div><div className="name">Bomba de Irrigação</div><div className="sub">{status.bomba ? 'ATIVA' : 'DESLIGADA'}</div></div><div className={`toggle ${status.bomba ? 'on' : 'off'}`}><i /></div></div>
                <div className="actuator"><div><div className="name">Válvula de Gotejamento</div><div className="sub">{status.valvula_aberta_pct}% aberta</div></div><div className={`toggle ${status.valvula_aberta_pct > 0 ? 'on' : 'off'}`}><i /></div></div>
                <div className="actuator"><div><div className="name">Ventilador</div><div className="sub">{status.ventilador ? 'LIGADO' : 'DESLIGADO'}</div></div><div className={`toggle ${status.ventilador ? 'on' : 'off'}`}><i /></div></div>
                <div className="actuator"><div><div className="name">LED (Fotoperíodo)</div><div className="sub">{status.led ? 'LIGADO' : 'DESLIGADO'}</div></div><div className={`toggle ${status.led ? 'on' : 'off'}`}><i /></div></div>
              </div>
            ) : (
              <div className="empty-alert">Nenhum status registrado ainda.</div>
            )}
          </div>

          <div className="card">
            <h2>Alertas e Eventos <span className="n">{alertas.length} ativos</span></h2>
            {alertas.length === 0 ? (
              <div className="empty-alert">Nenhum alerta ativo agora.</div>
            ) : (
              alertas.map((a) => (
                <div key={a.id} className={`alert ${a.nivel}`}>
                  <span className="dot" />
                  <div>
                    <div className="t">{a.titulo}</div>
                    <div className="s">{a.descricao}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="footer-wrap">Uvaí · Estufa inteligente para vinícola — Projeto PEITD, BTI/IMD/UFRN</footer>
      </main>
    </div>
  );
}
