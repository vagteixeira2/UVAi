# Uvaí — Painel da Estufa

Maquete educacional de estufa inteligente para vinícola (BTI/IMD/UFRN, disciplina PEITD).
Painel em Next.js + Supabase, na Serra de São Bento — RN.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # opcional, já vem com as chaves públicas
npm run dev
```

Abra http://localhost:3000

## Banco de dados (Supabase)

Projeto: `fikpmopplfxwdmdzhbpl` (região us-east-2), já com as tabelas criadas:

- `leituras` — histórico de sensores (temperatura, umidade do solo/ar, luminosidade,
  nível do reservatório e da caixa elevada, vento)
- `status_atual` — estado atual dos atuadores (bomba, válvula, ventilador, LED)
- `alertas` — eventos fora do normal
- `configuracoes` — limites ajustáveis (temp. máxima, umidade mínima, horário do LED)

## Conectando o ESP32

Quando o ESP32 estiver pronto, ele só precisa dar um POST em:

```
POST /api/leituras
Content-Type: application/json

{
  "temperatura": 24.8,
  "umidade_solo": 52,
  "umidade_ar": 64,
  "luminosidade": 78,
  "nivel_reservatorio": 61,
  "nivel_caixa_elevada": 78,
  "velocidade_vento": 12
}
```

O painel busca sempre a leitura mais recente — não precisa mudar nada no front-end.

## Controlando atuadores pelo dashboard

O dashboard agora tem botões reais (bomba, válvula, ventilador, LED). Como o
ESP32 não fica com um servidor esperando conexão, o fluxo é por fila de
comandos — o ESP32 pergunta periodicamente se tem algo pra fazer:

**1. Consultar comandos pendentes** (o ESP32 chama isso a cada poucos segundos):
```
GET /api/comandos
```
Resposta: `{ "ok": true, "comandos": [{ "id": 12, "alvo": "bomba", "ligado": true, ... }] }`

**2. Depois de executar fisicamente, confirmar:**
```
POST /api/comandos/confirmar
Content-Type: application/json

{ "id": 12, "alvo": "bomba", "ligado": true }
```

Isso marca o comando como executado e atualiza `status_atual`, que é o que o
dashboard exibe. Enquanto o ESP32 não confirma, o botão fica com "Aguardando
ESP32…" em vez de mudar de estado — o dashboard nunca finge que algo já
aconteceu fisicamente antes de ser confirmado.

**Nota de segurança:** as políticas de inserção do banco estão abertas (qualquer
requisição pode gravar uma leitura), o que é aceitável para o escopo do projeto
escolar. Se for além disso, vale trocar por uma chave compartilhada simples no
header da requisição, validada dentro da rota `/api/leituras`.

## Acesso ao dashboard

O painel fica atrás de uma senha única compartilhada pela equipe, definida na
variável `APP_PASSWORD`. Não é um sistema de contas — é só uma trava simples
via cookie, suficiente pro escopo do projeto. As rotas que o ESP32 usa
(`/api/leituras`, `/api/comandos`, `/api/comandos/confirmar`) ficam de fora
da trava de propósito, já que o hardware não tem como fazer login.

Ao entrar, o dashboard aparece em "standby" — o botão **Iniciar Sistema** só
dispara uma animação de apresentação (não liga nada de verdade no banco).

## Deploy

Recomendado: [Vercel](https://vercel.com) — importe este repositório e configure
as duas variáveis de ambiente do `.env.example` no painel do projeto.
