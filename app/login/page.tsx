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
      minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'IBM Plex Sans', sans-serif", color: '#fff', padding: 20, overflow: 'hidden',
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet" />

      <img src="/brand/capa.png" alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0,
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,8,6,0.45)', zIndex: 1 }} />

      <form onSubmit={entrar} style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: 360, border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 20, background: 'rgba(10,20,15,0.45)', backdropFilter: 'blur(18px)', padding: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <img src="/brand/icon.png" alt="Uvaí" style={{ width: 56, height: 'auto' }} />
        </div>
        <div style={{ textAlign: 'center', fontFamily: "'Fraunces', serif", fontSize: 20, letterSpacing: 3, marginBottom: 2 }}>UVAÍ</div>
        <div style={{ textAlign: 'center', fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)', marginBottom: 22 }}>
          TECNOLOGIA PARA VINHEDOS INTELIGENTES
        </div>

        <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', marginBottom: 18, textAlign: 'center' }}>
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
            border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(0,0,0,0.25)',
            color: '#fff', fontSize: 14, outline: 'none',
          }}
        />

        {erro && <div style={{ color: '#F0A0AC', fontSize: 12.5, marginBottom: 14, textAlign: 'center' }}>{erro}</div>}

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

        <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 18, letterSpacing: 1 }}>
          MAIS PRECISÃO. MELHORES COLHEITAS.
        </div>
      </form>
    </div>
  );
}
