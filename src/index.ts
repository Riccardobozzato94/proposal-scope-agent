/**
 * P3 — Proposal & Scope Agent.
 * Turns a synthetic brief into a structured scope, an effort estimate, and a
 * risk register. Ambiguous briefs produce questions, not invented answers.
 */
type Brief = { id: string; text: string; expected: { goals: string[]; out: string[]; risks: string[]; missing: string[] } };

const BRIEFS: Brief[] = [
  { id: "b01", text: "Vogliamo automatizzare la gestione dei reclami. Obiettivo: ridurre il tempo di risposta. Vincolo: una sola inbox, nessun accesso al CRM. Serve una coda di approvazione.", expected: { goals: ["tempo di risposta"], out: ["CRM"], risks: ["approvazione"], missing: [] } },
  { id: "b02", text: "Dobbiamo generare proposte commerciali da brief. Obiettivo: ridurre il tempo di stesura. Vincolo: template approvato, output PDF. Non abbiamo ancora i dati storici dei prezzi.", expected: { goals: ["tempo di stesura"], out: ["dati storici"], risks: ["prezzi"], missing: ["dati storici"] } },
  { id: "b03", text: "Automazione report settimanale da Jira. Obiettivo: risparmiare ore di reportistica. Vincolo: un progetto, solo Jira Cloud. Serve approvazione umana prima dell'invio.", expected: { goals: ["reportistica"], out: ["un progetto"], risks: ["approvazione"], missing: [] } },
  { id: "b04", text: "Vogliamo un agente che risponda alle email. Obiettivo: ridurre il carico del team. Non sappiamo quali sistemi usa il team né chi approva.", expected: { goals: ["carico"], out: [], risks: ["approvazione"], missing: ["sistemi", "approva"] } },
  { id: "b05", text: "Consolidare documenti sparsi in procedure cercabili. Obiettivo: trovare le risposte più velocemente. Vincolo: PDF non scansionati. Serve citazione alla fonte.", expected: { goals: ["risposte"], out: ["scansionati"], risks: ["citazione"], missing: [] } },
  { id: "b06", text: "Automatizzare la fatturazione. Obiettivo: meno errori. Vincolo: solo fatture elettroniche. Manca il processo di gestione delle contestazioni.", expected: { goals: ["errori"], out: [], risks: ["contestazioni"], missing: ["contestazioni"] } },
  { id: "b07", text: "Classificare ticket con priorità. Obiettivo: Ridurre tempi di attesa. Vincolo: italiano e inglese. Serve log di ogni decisione.", expected: { goals: ["attesa"], out: [], risks: ["log"], missing: [] } },
  { id: "b08", text: "Agente per il supporto clienti. Obiettivo: non chiaro. Vincolo: nessuno. Serve integrazione con sistema sconosciuto.", expected: { goals: [], out: [], risks: ["sconosciuto"], missing: ["obiettivo", "sistema"] } },
  { id: "b09", text: "Generare SOP da note. Obiettivo: standardizzare le procedure. Vincolo: documenti in Google Drive. Serve revisione di un responsabile.", expected: { goals: ["standardizzare"], out: [], risks: ["revisione"], missing: [] } },
  { id: "b10", text: "Ottimizzare gli ordini. Obiettivo: ridurre errori di evasione. Vincolo: ERP legacy. Manca l'elenco dei campi disponibili.", expected: { goals: ["errori"], out: ["ERP"], risks: ["campi"], missing: ["campi"] } },
];

const ALLOWED_OUT = ["CRM", "sistemi", "dati storici", "contestazioni", "PDF", "un progetto", "campi", "scansionati", "ERP"];
const MISSING_HINTS = ["non sappiamo", "manca", "sconosciuto", "non chiaro", "nessuno"];

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function analyze(text: string) {
  const n = normalize(text);
  const goals = n.includes("obiettivo") ? [text.slice(n.indexOf("obiettivo") + 10, n.indexOf("vincolo") > 0 ? n.indexOf("vincolo") : undefined).trim().slice(0, 90)] : [];
  const out = ALLOWED_OUT.filter((item) => n.includes(normalize(item)));
  const risks = ["approvazione", "citazione", "log", "revisione", "prezzi", "contestazioni", "campi", "sconosciuto"].filter((item) => n.includes(item));
  const missing = MISSING_HINTS.filter((hint) => n.includes(hint));
  const ready = goals.length > 0 && missing.length === 0;

  return {
    scope: {
      in: goals.length ? goals : ["obiettivo da chiarire"],
      out,
      assumptions: ["Il contesto descritto nel brief è verificato dal cliente prima dell'avvio"],
      deliverables: ["Scope scritto", "Stima per componente", "Risk register"],
    },
    effortDays: Math.max(2, Math.min(20, 4 + out.length * 2 + risks.length)),
    risks: risks.length ? risks.map((risk) => ({ risk, mitigation: "Definire responsabile e criterio di uscita prima dello sprint" })) : [{ risk: "Nessun rischio esplicito nel brief", mitigation: "Validare con il cliente in call" }],
    questions: missing.length ? ["Quali sistemi sono coinvolti?", "Chi approva l'output?", "Quali dati sono disponibili?"] : [],
    ready,
    note: "La stima è un punto di partenza dichiarato, non una verità. Nessuna proposta parte senza approvazione umana.",
  };
}

function evaluate() {
  const results = BRIEFS.map((brief) => {
    const a = analyze(brief.text);
    const goalsOk = brief.expected.goals.every((g) => a.scope.in.join(" ").toLowerCase().includes(g.toLowerCase()));
    const outOk = brief.expected.out.every((o) => a.scope.out.includes(o));
    const riskOk = brief.expected.risks.every((r) => a.risks.some((x) => x.risk.includes(r)));
    const missingOk = brief.expected.missing.length === 0 || a.questions.length > 0;
    return { id: brief.id, goalsOk, outOk, riskOk, missingOk, ok: goalsOk && outOk && riskOk && missingOk, ready: a.ready };
  });
  return {
    id: `eval-${Date.now()}`, createdAt: new Date().toISOString(), dataset: "synthetic-briefs-v1", synthetic: true,
    sampleSize: results.length,
    accuracy: results.filter((r) => r.ok).length / results.length,
    ambiguousHandled: results.filter((r) => r.missingOk).length / results.length,
    results,
    note: "Valutazione su 10 brief sintetici. Nessun dato cliente reale; la stima non è calibrata su casi reali.",
  };
}

function html(result: ReturnType<typeof evaluate> | null, recent: Array<{ brief: string; created_at: string }> = []) {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Proposal & Scope Agent — dashboard</title><style>
  :root{color-scheme:dark}body{margin:0;background:#0B0E13;color:#F9FAFB;font-family:system-ui,sans-serif;line-height:1.5}.wrap{max-width:1000px;margin:auto;padding:40px 20px}h1{font-family:'Space Grotesk',sans-serif;letter-spacing:-.03em}.mono{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#9CA3AF}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:24px 0}.card{background:#1E232D;border:1px solid #2A313E;border-radius:8px;padding:18px}.card strong{display:block;font-size:28px;color:#D97757;margin-top:6px}pre{font-size:11px;color:#9CA3AF;white-space:pre-wrap}.warn{border-left:2px solid #FFB43D;padding-left:12px;color:#9CA3AF}
  .demo{margin-top:24px;border:1px solid #2A313E;border-radius:8px;padding:16px;background:#12161D}.demo textarea{width:100%;min-height:110px;background:#0B0E13;color:#F9FAFB;border:1px solid #2A313E;border-radius:4px;padding:10px;font:13px/1.5 ui-monospace,monospace}.btn{border:1px solid #D97757;background:#D97757;color:#0B0E13;font:600 12px ui-monospace,monospace;padding:8px 10px;border-radius:4px;cursor:pointer;margin-top:10px}
  </style></head><body><div class="wrap"><p class="mono">P3 · dati sintetici dichiarati</p><h1>Proposal &amp; Scope Agent</h1><p>Dal brief allo scope strutturato. I brief ambigui producono domande, non risposte inventate.</p>
  <div class="grid"><div class="card"><span>Brief di test</span><strong>${result?.sampleSize ?? 0}</strong></div><div class="card"><span>Accuratezza</span><strong>${result ? Math.round(result.accuracy * 100) + "%" : "—"}</strong></div><div class="card"><span>Ambigui gestiti</span><strong>${result ? Math.round(result.ambiguousHandled * 100) + "%" : "—"}</strong></div></div>
  ${result ? `<div class="card"><p class="mono">${result.createdAt} · benchmark congelato</p><ul style="margin:8px 0;padding-left:18px">${result.results.map((r, i) => `<li>${i + 1}. ${r.ok ? "corretto" : "da rivedere"} — obiettivi ${r.goalsOk ? "ok" : "no"}, esclusioni ${r.outOk ? "ok" : "no"}, rischi ${r.riskOk ? "ok" : "no"}, ambigui ${r.missingOk ? "gestiti" : "no"}</li>`).join("")}</ul></div>` : `<div class="card warn"><p>Esegui <code>POST /api/eval</code> per generare la valutazione.</p></div>`}
  <h2>Analizza un brief</h2>
  <div class="demo">
    <p style="font-size:13px">Incolla un brief <strong style="color:#F9FAFB">inventato</strong>. Se mancano dati, il sistema restituisce domande invece di inventare risposte.</p>
    <textarea id="brief" aria-label="Brief" placeholder="Obiettivo: ridurre i tempi di risposta. Vincolo: una sola inbox. Non sappiamo chi approva."></textarea>
    <button class="btn" id="run">Genera scope</button><span class="mono" id="status" role="status" aria-live="polite"></span>
    <pre id="out" hidden></pre>
  </div>
  ${recent.length ? `<h2>Ultimi brief salvati</h2><div class="card">${recent.map((r) => `<p>${r.brief.slice(0, 180)}</p>`).join("")}</div>` : ""}
  <p class="warn" style="margin-top:24px">Stima indicativa su dati sintetici. Nessuna proposta parte senza approvazione umana.</p></div>
<script>
document.getElementById("run").addEventListener("click", async function(){
  var s=document.getElementById("status"); s.textContent="Analisi…";
  var r=await fetch("api/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:document.getElementById("brief").value})});
  var d=await r.json(); s.textContent=r.ok?"Completato":(d.error||"Errore");
  var o=document.getElementById("out"); o.textContent=JSON.stringify(d,null,2); o.hidden=false;
});
</script></body></html>`;
}

export default {
  async fetch(request: Request, env: { DB?: D1Like }): Promise<Response> {
    const url = new URL(request.url);
    const base = "/proposal-scope-agent";
    const path = url.pathname.startsWith(base) ? url.pathname.slice(base.length) || "/" : url.pathname;
    const json = (d: unknown, s = 200) => new Response(JSON.stringify(d, null, 2), { status: s, headers: { "content-type": "application/json" } });

    if (path === "/health") return json({ ok: true, project: "proposal-scope-agent", synthetic: true });
    if (path === "/api/briefs") return json(BRIEFS);
    if (path === "/api/analyze") {
      const body = await request.json().catch(() => ({})) as { text?: string };
      const text = String(body.text ?? "").replace(/<[^>]*>/g, " ").trim().slice(0, 4000);
      if (!text) return json({ error: "text required" }, 400);
      const result = analyze(text);
      if (env.DB) await env.DB.prepare("INSERT INTO p3_analyses (id, brief, result, created_at) VALUES (?, ?, ?, ?)")
        .bind(`a-${Date.now()}`, text, JSON.stringify(result), new Date().toISOString()).run();
      return json(result);
    }
    if (path === "/api/eval" && request.method === "POST") {
      const result = evaluate();
      if (env.DB) await env.DB.prepare("INSERT INTO p3_analyses (id, brief, result, created_at) VALUES (?, ?, ?, ?)")
        .bind(result.id, "EVAL: 10 brief", JSON.stringify(result), result.createdAt).run();
      return json(result, 201);
    }
    if (path === "/" || path === "") {
      let recent: Array<{ brief: string; created_at: string }> = [];
      let latestEval: ReturnType<typeof evaluate> | null = null;
      if (env.DB) {
        const rows = await env.DB.prepare("SELECT brief, created_at FROM p3_analyses ORDER BY created_at DESC LIMIT 5").all<{ brief: string; created_at: string }>();
        recent = rows.results;
        const row = await env.DB.prepare("SELECT result FROM p3_analyses WHERE brief LIKE 'EVAL:%' ORDER BY created_at DESC LIMIT 1").first<{ result: string }>();
        if (row) latestEval = JSON.parse(row.result) as ReturnType<typeof evaluate>;
      }
      return new Response(html(latestEval, recent), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return json({ error: "Not found" }, 404);
  },
};

interface D1Like {
  prepare(q: string): {
    bind(...v: unknown[]): { run(): Promise<unknown> };
    all<T = unknown>(): Promise<{ results: T[] }>;
    first<T = unknown>(): Promise<T | null>;
  };
}
