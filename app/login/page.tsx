'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setErro('Senha incorreta.');
      setEnviando(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(900px 500px at 15% -10%, rgba(95,217,140,0.12), transparent 60%), radial-gradient(700px 500px at 100% 0%, rgba(167,140,224,0.10), transparent 55%), #070C09',
      fontFamily: "'IBM Plex Sans', sans-serif", color: '#EAF2EC', padding: 20,
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet" />

      <form onSubmit={entrar} style={{
        width: '100%', maxWidth: 360, border: '1px solid rgba(232,244,236,0.12)', borderRadius: 20,
        background: 'rgba(232,244,236,0.045)', backdropFilter: 'blur(16px)', padding: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(145deg,#5FD98C,#A78CE0)', color: '#0A140E',
            fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 18,
          }}>U</div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, letterSpacing: 2 }}>UVAÍ</div>
            <div style={{ fontSize: 9, letterSpacing: 1, color: '#93A69B' }}>TECNOLOGIA PARA VINHEDOS</div>
          </div>
        </div>

        <div style={{ fontSize: 13.5, color: '#93A69B', marginBottom: 18 }}>
          Acesso da equipe — digite a senha compartilhada pra entrar no painel.
        </div>

        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          autoFocus
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 10, marginBottom: 14,
            border: '1px solid rgba(232,244,236,0.18)', background: 'rgba(0,0,0,0.2)',
            color: '#EAF2EC', fontSize: 14, outline: 'none',
          }}
        />

        {erro && <div style={{ color: '#F0687E', fontSize: 12.5, marginBottom: 14 }}>{erro}</div>}

        <button
          type="submit"
          disabled={enviando || !senha}
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none',
            background: '#5FD98C', color: '#0A140E', fontWeight: 600, fontSize: 14,
            cursor: enviando ? 'wait' : 'pointer', opacity: enviando || !senha ? 0.7 : 1,
          }}
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
