# P3 — Proposal & Scope Agent

10 brief sintetici → scope strutturato, stima indicativa, risk register. I brief ambigui producono domande invece di risposte inventate.

```bash
wrangler deploy --config projects/proposal-scope-agent/wrangler.toml
```

Endpoint: `/health`, `/api/briefs`, `POST /api/analyze {text}`, `POST /api/eval`. La dashboard ha un modulo brief: lo scope generato viene mostrato e salvato in D1 (`p3_analyses`).

## Metriche misurate (10 brief sintetici)

- Accuratezza: 80%
- Ambigui gestiti con domande: 90%

La stima non è calibrata su casi reali. Nessuna proposta parte senza approvazione umana.

## Link pubblici

- Demo live: https://proposal-scope-agent.riccardobozzato.workers.dev/
- Caso con metodo e limiti: https://riccardobozzato.com/casi/proposal-scope-agent
- Riproduzione eval: `POST /api/eval` sulla demo (10 brief sintetici con campi attesi nel codice).
- Autore: https://riccardobozzato.com/ — dati sintetici dichiarati, nessun cliente reale.
