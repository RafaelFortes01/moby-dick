import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Papa from "papaparse";
import { initTextures } from "./textures.js";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSYtRIgfIZgpnTPSHkxTqrvmElRCVSlzjChVBqwqQzdNNmmx2ZZgHZNTjwL_rWhOdLrrmjoCRB5lotd/pub?gid=0&single=true&output=csv";

// Troque pelos nomes de vocês dois (aparecem nas notas):
const NOME_VOCE = "Suum";
const NOME_AMIGO = "Magilla";

/* ---------- ajustes de exibição ---------- */
const ORDEM = "recentes";        // "recentes" | "carreira" — ordem dos anos na setlist
const NOTA_STYLE = "estrelas";   // "estrelas" | "numeros"
const SHOW_PRECOS = true;        // mostra quanto custou cada ingresso na setlist
const PAPEL_AMASSADO = 0.6;      // 0 a 1 — intensidade do amassado do papel
const RABISCOS = true;           // liga/desliga os desenhos a lápis (espiral, estrela, raio...)

/* ---------- desenhos ----------
   Enquanto não chegam os desenhos, cada slot vira um placeholder tracejado.
   Pra colocar a arte: ponha o arquivo em public/ e adicione `src`.
   Ex.: capa: { src: "/desenhos/capa.png", alt: "capa", label: "..." }
   As imagens entram com mix-blend-mode: multiply, então scan de lápis em
   fundo branco funciona direto — o branco some no papel.                   */
const DESENHOS = {
  capa: { label: "desenho da capa" },           // topo da setlist
  flyer: { label: "flyer do próximo show" },    // aba próximo
  melhor: { label: "foto do melhor show" },     // aba bônus, ao lado de "Top Shows"
  bonus: { label: "desenho / foto" },           // aba bônus, embaixo de "shows por ano"
  treta: { label: "rabisco da treta" },         // aba bônus, embaixo de "shows por ano"
};

// Desenhos soltos no meio da setlist, por data do show (AAAA-MM-DD, igual à planilha).
// Troque pelas datas dos shows que vocês quiserem ilustrar:
const DESENHOS_NA_SETLIST = {
  "2022-12-18": { label: "rabisco" },   // Knotfest
  "2023-04-09": { label: "rabisco" },   // Pierce The Veil
  "2026-09-05": { label: "rabisco" },   // Rock In Rio
};

const SAMPLE_DATA = [
  { data: "2021-11-20", headliner: "The Ghost Inside", suporte: "Stick To Your Guns", local: "Carioca Club", cidade: "São Paulo", preco: 180, setor: "pista", nota_voce: 8, nota_amigo: 7 },
  { data: "2022-04-15", headliner: "Knocked Loose", suporte: "Kublai Khan TX; Vein.fm", local: "Hangar 110", cidade: "São Paulo", preco: 160, setor: "pista", nota_voce: 10, nota_amigo: 8 },
  { data: "2022-09-10", headliner: "Whitechapel", suporte: "Fit For An Autopsy", local: "Tropical Butantã", cidade: "São Paulo", preco: 200, setor: "pista", nota_voce: 7, nota_amigo: 9 },
  { data: "2023-03-25", headliner: "Motionless In White", suporte: "Currents", local: "Carioca Club", cidade: "São Paulo", preco: 240, setor: "mezanino", nota_voce: 6, nota_amigo: 9 },
  { data: "2023-06-17", headliner: "Lorna Shore", suporte: "Kublai Khan TX", local: "Audio", cidade: "São Paulo", preco: 260, setor: "pista", nota_voce: 10, nota_amigo: 10 },
  { data: "2023-10-07", headliner: "Spiritbox", suporte: "", local: "Cine Joia", cidade: "São Paulo", preco: 220, setor: "pista", nota_voce: 9, nota_amigo: 7 },
  { data: "2024-02-24", headliner: "Thy Art Is Murder", suporte: "Fit For An Autopsy; Dying Wish", local: "Tropical Butantã", cidade: "São Paulo", preco: 230, setor: "pista", nota_voce: 8, nota_amigo: 8 },
  { data: "2024-05-18", headliner: "Bad Omens", suporte: "Currents", local: "Vibra São Paulo", cidade: "São Paulo", preco: 320, setor: "pista", nota_voce: 7, nota_amigo: 6 },
  { data: "2024-08-30", headliner: "Knocked Loose", suporte: "The Ghost Inside", local: "Audio", cidade: "São Paulo", preco: 250, setor: "pista", nota_voce: 10, nota_amigo: 9 },
  { data: "2024-09-22", evento: "Rock in Rio", headliner: "Avenged Sevenfold", suporte: "Bullet For My Valentine; Trivium; Sepultura", local: "Parque Olímpico", cidade: "Rio de Janeiro", preco: 620, setor: "pista", nota_voce: 9, nota_amigo: 5 },
  { data: "2024-11-16", headliner: "Lorna Shore", suporte: "Whitechapel; Kublai Khan TX", local: "Vibra São Paulo", cidade: "São Paulo", preco: 340, setor: "pista", nota_voce: 10, nota_amigo: 10 },
  { data: "2025-04-12", headliner: "Spiritbox", suporte: "Currents", local: "Audio", cidade: "São Paulo", preco: 280, setor: "pista", nota_voce: 8, nota_amigo: 8 },
  { data: "2025-05-24", evento: "I Wanna Be Tour", headliner: "", suporte: "The Devil Wears Prada; Memphis May Fire; We Came As Romans; Crown The Empire; Sleeping With Sirens", local: "Vibra São Paulo", cidade: "São Paulo", preco: 380, setor: "pista", nota_voce: 7, nota_amigo: 8 },
  { data: "2025-07-05", headliner: "Fit For An Autopsy", suporte: "Dying Wish", local: "Fabrique Club", cidade: "São Paulo", preco: 210, setor: "pista", nota_voce: 9, nota_amigo: 7 },
  { data: "2025-09-20", headliner: "Bad Omens", suporte: "Bilmuri", local: "Vibra São Paulo", cidade: "São Paulo", preco: 360, setor: "pista", nota_voce: 8, nota_amigo: 9 },
  { data: "2025-12-06", headliner: "Lorna Shore", suporte: "Shadow Of Intent; Signs Of The Swarm", local: "Audio", cidade: "São Paulo", preco: 300, setor: "pista", nota_voce: 10, nota_amigo: 9 },
  { data: "2026-03-14", headliner: "Knocked Loose", suporte: "Speed; Momentum", local: "Tropical Butantã", cidade: "São Paulo", preco: 270, setor: "pista", nota_voce: 9, nota_amigo: 10 },
  { data: "2026-09-19", headliner: "Whitechapel", suporte: "Signs Of The Swarm; Ingested", local: "Carioca Club", cidade: "São Paulo", preco: 290, setor: "pista" },
  { data: "2026-11-08", headliner: "Lorna Shore", suporte: "Fit For An Autopsy; Kublai Khan TX", local: "Vibra São Paulo", cidade: "São Paulo", preco: 380, setor: "pista" },
];

/* ---------- utils ---------- */
const parseDate = (s) => {
  if (!s) return null;
  const [y, m, d] = String(s).trim().split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const todayMid = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const daysBetween = (a, b) => Math.round((a - b) / 86400000);
const weekdayBR = (dt) => dt.toLocaleDateString("pt-BR", { weekday: "long" });
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtShort = (dt) => `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}`;
const fmtShortY = (dt) => `${fmtShort(dt)}.${String(dt.getFullYear()).slice(2)}`;
const supportsOf = (ev) => (ev.suporte || "").split(";").map((x) => x.trim()).filter(Boolean);
const bandsOf = (ev) => [ev.headliner, ...supportsOf(ev)].filter(Boolean);
const isFest = (ev) => !!ev.evento;
const titleOf = (ev) => ev.evento || ev.headliner;
const lineupOf = (ev) => (isFest(ev) ? bandsOf(ev) : supportsOf(ev));
const parseNota = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(n) ? Math.round(n) : null; };
const notasDe = (ev) => [ev.notaVoce, ev.notaAmigo].filter((n) => n != null);
const avgNota = (ev) => { const a = notasDe(ev); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; };
const gapNota = (ev) => (ev.notaVoce != null && ev.notaAmigo != null) ? Math.abs(ev.notaVoce - ev.notaAmigo) : null;
const fmtNota = (n) => (n == null ? "–" : String(Math.round(n)));
const fmtMedia = (n) => (n == null ? "–" : String(Math.round(n * 10) / 10).replace(".", ","));
const up = (s) => String(s || "").toUpperCase();
const keyOf = (ev) => `${ev.data}|${titleOf(ev)}|${ev.local}`;
const lineupTxt = (ev) => { const lp = lineupOf(ev); return lp.length ? `${isFest(ev) ? "lineup: " : "com "}${lp.join(" · ")}` : ""; };
const falta = (d) => (d === 0 ? "é hoje!!" : `faltam ${d} ${d === 1 ? "dia" : "dias"}`);
const dataLonga = (dt) => `${dt.getDate()} de ${dt.toLocaleDateString("pt-BR", { month: "long" })} de ${dt.getFullYear()}`;

// Contagem por tracinhos, como se conta no papel: grupos de 5 (4 em pé e o
// 5º cortando na diagonal). Cada traço leva uma inclinação pequena e fixa.
const tracinhos = (n) => {
  const grupos = [];
  for (let i = 0, k = n; k > 0; i++, k -= 5) {
    const m = Math.min(k, 5);
    grupos.push({
      cheio: m === 5,
      tracos: Array.from({ length: m === 5 ? 4 : m }, (_, j) => `${((i * 7 + j * 13) % 9) - 4}deg`),
    });
  }
  return grupos;
};

const normalizeRows = (rows) =>
  rows
    .map((r) => ({
      data: r.data,
      dateObj: parseDate(r.data),
      evento: (r.evento || "").trim(),
      headliner: (r.headliner || "").trim(),
      suporte: r.suporte || "",
      local: (r.local || "").trim(),
      cidade: (r.cidade || "").trim(),
      preco: Number(String(r.preco ?? "").replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
      setor: (r.setor || "").trim(),
      notaVoce: parseNota(r.nota_voce),
      notaAmigo: parseNota(r.nota_amigo),
      notas: (r.notas || "").trim(),
    }))
    .filter((r) => r.dateObj && (r.headliner || r.evento || r.suporte))
    .sort((a, b) => a.dateObj - b.dateObj);

const ABAS = ["setlist", "bonus", "proximo"];
const reduzMovimento = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function App() {
  const [rawRows, setRawRows] = useState(SHEET_CSV_URL ? null : SAMPLE_DATA);
  const [source, setSource] = useState(SHEET_CSV_URL ? "carregando" : "exemplo");
  const [query, setQuery] = useState("");
  const [aba, setAba] = useState("setlist");
  const [sel, setSel] = useState(null);

  useEffect(() => {
    if (!SHEET_CSV_URL) return;
    Papa.parse(SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => { setRawRows(res.data); setSource("live"); },
      error: () => { setRawRows(SAMPLE_DATA); setSource("erro"); },
    });
  }, []);

  // texturas de canvas (madeira e amassado) + intensidade do amassado
  useEffect(() => {
    document.documentElement.style.setProperty("--md-cr-op", String(PAPEL_AMASSADO));
    initTextures();
  }, []);

  const events = useMemo(() => normalizeRows(rawRows || []), [rawRows]);
  const hoje = todayMid();

  const past = useMemo(() => events.filter((e) => e.dateObj < hoje), [events]);
  const upcoming = useMemo(() => events.filter((e) => e.dateObj >= hoje), [events]);
  const next = upcoming[0] || null;
  const nextCountdown = next ? daysBetween(next.dateObj, hoje) : null;

  const stats = useMemo(() => {
    const gasto = past.reduce((s, e) => s + e.preco, 0);
    const bandCount = {};
    past.forEach((e) => bandsOf(e).forEach((b) => { bandCount[b] = (bandCount[b] || 0) + 1; }));
    const ranking = Object.entries(bandCount).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const byYear = {};
    past.forEach((e) => { const y = e.dateObj.getFullYear(); byYear[y] = (byYear[y] || 0) + 1; });
    const venues = new Set(past.map((e) => e.local).filter(Boolean)).size;
    return { gasto, ranking, byYear, venues };
  }, [past]);

  // A pergunta é "quantas vezes vimos ESTA banda", então a busca escolhe UMA banda
  // e conta os shows dela — nunca a soma de todas as bandas que casam com o texto.
  const search = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const candidatas = new Set();
    past.forEach((e) => bandsOf(e).forEach((b) => {
      if (b.toLowerCase().includes(q)) candidatas.add(b);
    }));
    if (!candidatas.size) return { termo: query.trim(), banda: null, outras: [], count: "0x", hits: [] };

    const showsDe = (banda) => {
      const alvo = banda.toLowerCase();
      return past.filter((e) => bandsOf(e).some((b) => b.toLowerCase() === alvo));
    };
    // nome exato vence quem começa com o texto, que vence quem só o contém;
    // empate vai pra banda mais vista.
    const precisao = (b) => {
      const n = b.toLowerCase();
      return n === q ? 0 : n.startsWith(q) ? 1 : 2;
    };
    const ordenadas = [...candidatas].sort((a, b) =>
      precisao(a) - precisao(b) || showsDe(b).length - showsDe(a).length || a.localeCompare(b)
    );

    const banda = ordenadas[0];
    const alvo = banda.toLowerCase();
    const shows = showsDe(banda);

    return {
      termo: query.trim(),
      banda,
      outras: ordenadas.slice(1, 6),
      // "x" e não "×": a Londrina não tem esse glifo
      count: `${shows.length}x`,
      hits: [...shows].reverse().map((e) => ({
        key: keyOf(e),
        date: fmtShortY(e.dateObj),
        place: `${e.local} · ${e.cidade}`,
        roleUp: e.evento ? "FESTIVAL" : (e.headliner && e.headliner.toLowerCase() === alvo ? "HEADLINER" : "SUPORTE"),
      })),
    };
  }, [query, past]);

  // agrupa a setlist por ano — mais recentes primeiro, ou a carreira desde o começo
  const years = useMemo(() => {
    const carreira = ORDEM === "carreira";
    const hist = {};
    (carreira ? events : [...events].reverse()).forEach((e) => {
      const y = e.dateObj.getFullYear();
      (hist[y] = hist[y] || []).push(e);
    });
    return Object.entries(hist)
      .sort((a, b) => (carreira ? a[0] - b[0] : b[0] - a[0]))
      .map(([y, shows], i) => ({
        key: y,
        label: `${i + 1}. ${y}`,
        rabisco: ["estrela", "raio", "seta"][i % 3],
        countUp: shows.length === 1 ? "1 SHOW" : `${shows.length} SHOWS`,
        shows,
      }));
  }, [events]);

  const topShows = useMemo(
    () => past.filter((e) => avgNota(e) != null)
      .sort((a, b) => avgNota(b) - avgNota(a) || b.dateObj - a.dateObj)
      .slice(0, 5),
    [past]
  );

  const treta = useMemo(() => {
    const withGap = past.filter((e) => gapNota(e) != null);
    if (!withGap.length) return null;
    return withGap.reduce((m, e) => (gapNota(e) > gapNota(m) ? e : m));
  }, [past]);

  const byYearEntries = Object.entries(stats.byYear).sort((a, b) => a[0] - b[0]);

  /* ---------- aba e show selecionado ---------- */
  // seleção padrão: o próximo show; se não tiver, o último que já rolou
  const selKey = sel ?? (next ? keyOf(next) : past.length ? keyOf(past[past.length - 1]) : null);
  const rowKeys = useMemo(() => years.flatMap((y) => y.shows.map(keyOf)), [years]);
  const rowRefs = useRef({});
  const revelar = useRef(null);

  const abaAtual = useRef(aba);
  abaAtual.current = aba;
  const irPara = useCallback((destino) => {
    if (destino === abaAtual.current) return;
    setAba(destino);
    window.scrollTo({ top: 0, behavior: reduzMovimento() ? "auto" : "smooth" });
  }, []);

  // teclado: 1/2/3 trocam de aba; ↑/↓ andam pela setlist
  const teclado = useRef({});
  teclado.current = { aba, selKey, rowKeys, irPara };
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const { aba: a, selKey: atual, rowKeys: ks, irPara: ir } = teclado.current;
      if (e.key === "1" || e.key === "2" || e.key === "3") { ir(ABAS[+e.key - 1]); return; }
      if (a !== "setlist" || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
      e.preventDefault();
      if (!ks.length) return;
      const i = Math.max(0, Math.min(ks.length - 1, ks.indexOf(atual) + (e.key === "ArrowDown" ? 1 : -1)));
      revelar.current = ks[i];
      setSel(ks[i]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // depois de andar com as setas, rola só se a linha saiu da área visível.
  // scrollBy em vez de scrollIntoView: o HUD fixo cobriria a linha no fim da tela.
  useEffect(() => {
    const k = revelar.current;
    if (!k) return;
    revelar.current = null;
    const el = rowRefs.current[k];
    if (!el) return;
    const r = el.getBoundingClientRect(), H = window.innerHeight;
    if (r.top < 110 || r.bottom > H - 130) {
      window.scrollBy({ top: r.top - H * 0.42, behavior: reduzMovimento() ? "auto" : "smooth" });
    }
  }, [selKey]);

  if (source === "carregando") {
    return (
      <>
        <SvgFilters />
        <Mesa />
        <div className="carregando">carregando o caderno…</div>
      </>
    );
  }

  const profundidade = (tipo) => (ABAS.indexOf(tipo) - ABAS.indexOf(aba) + 3) % 3;

  return (
    <>
      <SvgFilters />
      <Mesa next={next} />

      <main className="page">
        <div className="pilha">
          <Folha tipo="setlist" n={1} rotulo="setlist" profundidade={profundidade("setlist")} onAba={() => irPara("setlist")}>
            <Setlist
              source={source}
              past={past}
              stats={stats}
              years={years}
              hoje={hoje}
              next={next}
              selKey={selKey}
              onPick={setSel}
              rowRefs={rowRefs}
            />
          </Folha>
          <Folha tipo="bonus" n={2} rotulo="bônus" profundidade={profundidade("bonus")} onAba={() => irPara("bonus")}>
            <Bonus
              topShows={topShows}
              treta={treta}
              ranking={stats.ranking}
              byYearEntries={byYearEntries}
              search={search}
              query={query}
              setQuery={setQuery}
            />
          </Folha>
          <Folha tipo="proximo" n={3} rotulo="próximo" profundidade={profundidade("proximo")} onAba={() => irPara("proximo")}>
            <Proximo next={next} nextCountdown={nextCountdown} upcoming={upcoming} hoje={hoje} />
          </Folha>
        </div>
      </main>

      <Hud aba={aba} irPara={irPara} />
    </>
  );
}

/* =====================================================================
   FOLHA 1 — setlist
   ===================================================================== */
function Setlist({ source, past, stats, years, hoje, next, selKey, onPick, rowRefs }) {
  const useStars = NOTA_STYLE === "estrelas";
  const slotsNaOrdem = Object.keys(DESENHOS_NA_SETLIST);

  return (
    <>
      {RABISCOS && <Rabisco tipo="espiral" className="rab-espiral" />}
      <div className="capa">
        <span className="fita fita--capa" />
        <Slot slot={DESENHOS.capa} className="slot--capa" />
      </div>
      <h1 className="gotica gotica--moby">Moby Dick</h1>
      {RABISCOS && <Rabisco tipo="sublinhado" className="rab-sublinhado" />}
      <div className="setlist-sub">arquivo de shows · {NOME_VOCE} &amp; {NOME_AMIGO}</div>
      {source === "erro" && <div className="aviso-planilha">a planilha não carregou — mostrando exemplo</div>}

      <div className="numeros">
        <span className="numero"><b>{past.length}</b> shows</span>
        <span className="numero"><b>{stats.ranking.length}</b> bandas</span>
        <span className="numero"><b>{stats.venues}</b> casas</span>
        <span className="numero"><b className="numero--gasto">{brl(stats.gasto)}</b> queimados em ingresso</span>
      </div>

      {years.map((yr) => (
        <section className="ano" key={yr.key}>
          <div className="ano-cab">
            <span className="ano-rotulo">{yr.label}</span>
            {RABISCOS && <Rabisco tipo={yr.rabisco} className={`rab-ano rab-ano--${yr.rabisco}`} />}
            <span className="ano-espaco" />
            <span className="ano-conta">{yr.countUp}</span>
          </div>

          {yr.shows.map((e) => {
            const k = keyOf(e);
            const futuro = e.dateObj >= hoje;
            const escolhido = k === selKey;
            const ehProximo = !!next && k === keyOf(next);
            const media = avgNota(e);
            const desenho = DESENHOS_NA_SETLIST[e.data];
            const dias = daysBetween(e.dateObj, hoje);
            return (
              <div
                key={k}
                ref={(el) => { if (el) rowRefs.current[k] = el; else delete rowRefs.current[k]; }}
                className={"show" + (escolhido ? " show--sel" : "") + (futuro ? " show--futuro" : "")}
                onClick={() => onPick(k)}
                aria-current={escolhido ? "true" : undefined}
              >
                {escolhido && <span className="show-faixa" aria-hidden="true" />}
                {escolhido && <Controle />}
                {!futuro && <Rabisco tipo="check" className="show-check" />}

                <span className="show-meio">
                  <span className="show-linha">
                    <span className="show-titulo">{titleOf(e)}</span>
                    {isFest(e) && <span className="tag tag--fest">FESTIVAL</span>}
                    {futuro && <span className="tag tag--vai">AINDA VAI ROLAR</span>}
                  </span>
                  {lineupTxt(e) && <span className="show-lineup">{lineupTxt(e)}</span>}
                  <span className="show-local">{up(`${fmtShortY(e.dateObj)} · ${e.local} · ${e.cidade}`)}</span>
                  {escolhido && (
                    <span className="show-detalhe">
                      <span className="show-d1">
                        {e.dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        {e.setor ? ` · ${e.setor}` : ""}
                      </span>
                      <span className="show-d2">
                        {futuro
                          ? falta(dias)
                          : media != null
                            ? `${NOME_VOCE} deu ${fmtNota(e.notaVoce)} · ${NOME_AMIGO} deu ${fmtNota(e.notaAmigo)}`
                            : "falta dar nota"}
                      </span>
                    </span>
                  )}
                </span>

                {desenho && (
                  <span className={`show-slot show-slot--${slotsNaOrdem.indexOf(e.data) % 3}`}>
                    <Slot slot={desenho} className="slot--linha" />
                  </span>
                )}

                <span className="show-direita">
                  {media != null && useStars && <Estrelas nota={media} />}
                  {media != null && !useStars && (
                    <span className="show-notas">{fmtNota(e.notaVoce)} / {fmtNota(e.notaAmigo)}</span>
                  )}
                  {media == null && !futuro && <span className="show-sem-nota">falta dar nota</span>}
                  {ehProximo && (
                    <span className="show-falta">
                      {falta(dias)}
                      <Rabisco tipo="circulo" className="rab-circulo" />
                    </span>
                  )}
                  {SHOW_PRECOS && <span className="show-preco">{brl(e.preco)}</span>}
                </span>
              </div>
            );
          })}
        </section>
      ))}

      {RABISCOS && <Rabisco tipo="carinha" className="rab-carinha" />}
    </>
  );
}

/* =====================================================================
   FOLHA 2 — bônus
   ===================================================================== */
function Bonus({ topShows, treta, ranking, byYearEntries, search, query, setQuery }) {
  const useStars = NOTA_STYLE === "estrelas";
  return (
    <>
      <div className="capa capa--bonus">
        <span className="fita fita--bonus" />
        <Slot slot={DESENHOS.melhor} className="slot--melhor" />
      </div>
      <h2 className="gotica gotica--top">Top Shows</h2>
      <div className="bonus-sub">nota do {NOME_VOCE} &amp; do {NOME_AMIGO}</div>

      <div className="top">
        {topShows.map((e, i) => (
          <div className="top-linha" key={keyOf(e)}>
            <span className="top-pos">{i + 1}</span>
            <span className="top-meio">
              <span className="top-titulo">{titleOf(e)}</span>
              <span className="top-meta">{up(`${fmtShortY(e.dateObj)} · ${e.local}`)}</span>
            </span>
            {useStars
              ? <Estrelas nota={avgNota(e)} tom="verde" />
              : <span className="top-notas">{fmtNota(e.notaVoce)} / {fmtNota(e.notaAmigo)}</span>}
            <span className="top-media">{fmtMedia(avgNota(e))}</span>
          </div>
        ))}
      </div>

      {treta && gapNota(treta) > 0 && (
        <div className="treta">
          <span className="treta-rotulo">MAIOR TRETA</span>
          <span className="treta-show">{titleOf(treta)} · {fmtShortY(treta.dateObj)}</span>
          <span className="pontilhado" />
          <span className="treta-notas">
            {up(NOME_VOCE)} {fmtNota(treta.notaVoce)} x {fmtNota(treta.notaAmigo)} {up(NOME_AMIGO)}
          </span>
        </div>
      )}

      <div className="contagens">
        <div>
          <div className="secao">MAIS VISTAS AO VIVO</div>
          <div className="lista-tracos">
            {ranking.slice(0, 8).map(([banda, n]) => (
              <div className="banda" key={banda}>
                <span className="banda-nome">{banda}</span>
                <span className="pontilhado pontilhado--baixo" />
                <Tracinhos n={n} cor="vermelho" />
                <span className="banda-n">{n}x</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="secao">SHOWS POR ANO</div>
          <div className="lista-tracos">
            {byYearEntries.map(([y, n]) => (
              <div className="ano-barra" key={y}>
                <span className="ano-barra-y">{y}</span>
                <Tracinhos n={n} cor="azul" />
                <span className="pontilhado pontilhado--baixo" />
                <span className="ano-barra-n">{n}</span>
              </div>
            ))}
          </div>
          <div className="bonus-slots">
            <Slot slot={DESENHOS.bonus} className="slot--bonus slot--gira-a" />
            <Slot slot={DESENHOS.treta} className="slot--bonus slot--gira-b" />
          </div>
        </div>
      </div>

      <div className="busca">
        <div className="secao">QUANTAS VEZES A GENTE VIU…</div>
        <label className="busca-campo">
          <span className="busca-caixa">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="escreve a banda aqui"
              spellCheck={false}
            />
            {/* O cursor nativo não aparece com o campo vazio aqui dentro (a folha tem
                transform no ancestral), e quando aparecia era mais fino que esta barrinha.
                Então ele fica escondido e quem desenha o cursor é sempre ela: o texto
                espelhado (invisível) a empurra até o fim do que foi digitado. */}
            <span className="busca-cursor" aria-hidden="true">
              <span className="busca-cursor-txt">{query}</span>
              <span className="busca-caret" />
            </span>
          </span>
        </label>

        {search && (
          <div className="busca-resultado">
            {search.banda ? (
              <>
                <div className="busca-linha">
                  a gente viu <span className="busca-banda">{search.banda}</span>{" "}
                  <span className="busca-conta">{search.count}</span>
                </div>
                {search.outras.length > 0 && (
                  <div className="busca-outras">
                    ou:{" "}
                    {search.outras.map((b, i) => (
                      <React.Fragment key={b}>
                        {i > 0 && " · "}
                        <button type="button" className="busca-outra" onClick={() => setQuery(b)}>{b}</button>
                      </React.Fragment>
                    ))}
                  </div>
                )}
                <div className="busca-hits">
                  {search.hits.map((h) => (
                    <div className="hit" key={h.key}>
                      <span className="hit-data">{h.date}</span>
                      <span className="hit-local">{h.place}</span>
                      <span className="pontilhado" />
                      <span className="hit-papel">{h.roleUp}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="busca-linha busca-vazio">ainda não — “{search.termo}” não tá no caderno.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* =====================================================================
   FOLHA 3 — próximo
   ===================================================================== */
function Proximo({ next, nextCountdown, upcoming, hoje }) {
  const depois = upcoming.slice(1);
  return (
    <>
      <div className="capa capa--flyer">
        <span className="fita fita--flyer" />
        <Slot slot={DESENHOS.flyer} className="slot--flyer" />
      </div>
      <h2 className="gotica gotica--prox">Próximo show</h2>

      {next ? (
        <>
          <div className="prox-titulo">{titleOf(next)}</div>
          {lineupTxt(next) && <div className="prox-lineup">{lineupTxt(next)}</div>}
          <div className="prox-local">{up(`${next.local} · ${next.cidade}`)}</div>

          <div className="contagem">
            <div className="contagem-caixa">
              {RABISCOS && <Rabisco tipo="circulo" className="rab-circulo rab-circulo--grande" largura={3.4} />}
              <span className="contagem-n">{nextCountdown}</span>
              <span className="contagem-txt">
                <span className="contagem-unid">{nextCountdown === 1 ? "DIA" : "DIAS"}</span>
                <span className="contagem-dia">{weekdayBR(next.dateObj)}</span>
                <span className="contagem-data">{up(dataLonga(next.dateObj))}</span>
              </span>
            </div>
            {RABISCOS && <Rabisco tipo="seta" className="rab-seta-prox" largura={4} />}
          </div>
        </>
      ) : (
        <>
          <div className="prox-titulo">nada marcado</div>
          <div className="prox-lineup">sem show no radar. bora comprar ingresso.</div>
        </>
      )}

      {depois.length > 0 && (
        <div className="depois">
          <div className="secao">DEPOIS VEM</div>
          {depois.map((e) => (
            <div className="depois-linha" key={keyOf(e)}>
              <span className="depois-data">{fmtShortY(e.dateObj)}</span>
              <span className="depois-meio">
                <span className="depois-titulo">{titleOf(e)}</span>
                <span className="depois-local">{up(`${e.local} · ${e.cidade}`)}</span>
              </span>
              <span className="depois-falta">{falta(daysBetween(e.dateObj, hoje))}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bilhete">
        <div className="bilhete-papel" aria-hidden="true"><div className="bilhete-face"><div className="bilhete-amassado" /></div></div>
        <span className="fita fita--bilhete" />
        <div className="bilhete-corpo">
          <div className="bilhete-rotulo">REGRA DA CASA</div>
          <p className="bilhete-txt">
            Só entra show que a gente <span className="bilhete-em">foi de fato</span>. Fica de fora:
            ingresso comprado e não usado, emo revival, e compra cancelada — aka Bangers Open Air.
          </p>
        </div>
      </div>
    </>
  );
}

/* =====================================================================
   peças compartilhadas
   ===================================================================== */

/* Uma folha da pilha. A ativa (profundidade 0) define a altura; as outras duas
   ficam atrás, deslocadas, mostrando só a aba rasgada e uma beirada. */
function Folha({ tipo, n, rotulo, profundidade, onAba, children }) {
  const ativa = profundidade === 0;
  return (
    <section className={`folha folha--${tipo} folha--d${profundidade}`} aria-label={rotulo}>
      <div className="folha-papel" aria-hidden="true">
        <div className="folha-furos">
          <div className="folha-borda"><div /></div>
          <div className="folha-face">
            <div className="folha-amassado" />
            <div className="folha-fibra" />
            <div className="folha-sombra" />
            {tipo === "setlist" && <><div className="folha-margem" /><div className="folha-cafe" /><div className="folha-grafite" /></>}
          </div>
        </div>
      </div>
      <button type="button" className="folha-aba" onClick={onAba} aria-pressed={ativa}>
        <span className={`fret fret--${n}`}>{n}</span>
        <span className="folha-aba-txt">{rotulo}</span>
      </button>
      {ativa && <div className="folha-corpo">{children}</div>}
    </section>
  );
}

function Hud({ aba, irPara }) {
  return (
    <nav className="hud" aria-label="abas">
      <div className="pilula pilula--navegar" aria-hidden="true">
        <span className="fret fret--seta">↑</span>
        <span className="fret fret--seta">↓</span>
        <span className="pilula-txt">NAVEGAR</span>
      </div>
      <button type="button" className="pilula" onClick={() => irPara("setlist")} aria-pressed={aba === "setlist"}>
        <span className="fret fret--1">1</span><span className="pilula-txt">SETLIST</span>
      </button>
      <button type="button" className="pilula" onClick={() => irPara("bonus")} aria-pressed={aba === "bonus"}>
        <span className="fret fret--2">2</span><span className="pilula-txt">BÔNUS</span>
      </button>
      <button type="button" className="pilula" onClick={() => irPara("proximo")} aria-pressed={aba === "proximo"}>
        <span className="fret fret--3">3</span><span className="pilula-txt">PRÓXIMO</span>
      </button>
    </nav>
  );
}

/* A mesa de madeira por trás de tudo: texturas, sujeira e as coisas largadas
   em cima (lápis, palheta, adesivo, ingresso do próximo show). */
function Mesa({ next }) {
  return (
    <div className="mesa" aria-hidden="true">
      <div className="mesa-base" />
      <div className="mesa-madeira" />
      <div className="mesa-fibra" />
      <div className="mesa-luz" />
      <div className="mesa-manchas" />
      <div className="mesa-encardido" />
      <div className="pegada pegada--a"><span /><span /></div>
      <div className="pegada pegada--b"><span /><span /></div>
      <div className="lapis"><span className="lapis-borracha" /><span className="lapis-anel" /><span className="lapis-corpo" /><span className="lapis-ponta"><span /></span></div>
      <div className="palheta"><span>MD</span></div>
      {next && (
        <div className="ingresso">
          <div className="ingresso-papel">
            <div className="ingresso-meio">
              <div className="ingresso-cab">INGRESSO · PRÓXIMO SHOW</div>
              <div className="ingresso-titulo">{titleOf(next)}</div>
              <div className="ingresso-linha">{up(`${next.local} · ${next.cidade}`)}</div>
              <div className="ingresso-linha">{up(`${fmtShortY(next.dateObj)}${next.setor ? ` · ${next.setor}` : ""}`)}</div>
            </div>
            <div className="ingresso-canhoto"><span>{brl(next.preco)}</span></div>
          </div>
        </div>
      )}
      <div className="adesivo"><span className="adesivo-md">MD</span><span className="adesivo-txt">AO VIVO · SP</span></div>
    </div>
  );
}

/* Cursor de controle de Guitar Hero ao lado do show escolhido (só em tela larga, via CSS). */
function Controle() {
  return (
    <span className="controle" aria-hidden="true">
      <span className="controle-papel"><span /></span>
      <span className="controle-corpo">
        <span className="controle-braco" />
        <span className="controle-botao controle-botao--a" />
        <span className="controle-botao controle-botao--b" />
        <span className="controle-ponte" />
      </span>
      <span className="controle-alavanca"><span /></span>
    </span>
  );
}

function Tracinhos({ n, cor }) {
  return (
    <span className={`tracinhos tracinhos--${cor}`} aria-label={`${n}`}>
      {tracinhos(n).map((g, i) => (
        <span className="tracinhos-grupo" key={i}>
          {g.tracos.map((r, j) => <span className="traco" key={j} style={{ transform: `rotate(${r})` }} />)}
          {g.cheio && <span className="traco-corte" />}
        </span>
      ))}
    </span>
  );
}

/* nota 0–10 vira 5 estrelas, com meia estrela: duas camadas sobrepostas,
   a de cima recortada na fração exata. */
function Estrelas({ nota, tom = "bege" }) {
  if (nota == null) return null;
  const pct = Math.max(0, Math.min(100, (nota / 10) * 100));
  return (
    <span className={`estrelas estrelas--${tom}`} role="img" aria-label={`${Math.round(nota * 10) / 10} de 10`}>
      <span className="estrelas-vazias" aria-hidden="true">★★★★★</span>
      <span className="estrelas-cheias" aria-hidden="true" style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

/* espaço pra desenho: vira <img> assim que o slot ganhar um `src` */
function Slot({ slot, className = "" }) {
  if (!slot) return null;
  if (slot.src) return <img className={`slot-img ${className}`} src={slot.src} alt={slot.alt || ""} />;
  return (
    <div className={`slot ${className}`}>
      <svg className="slot-icone" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <circle cx="9" cy="10" r="1.8" />
        <path d="M4 17.5 L10 12.5 L14 15.5 L17 13 L20 15.5" />
      </svg>
      <span className="slot-txt">{slot.label}</span>
    </div>
  );
}

/* Rabiscos a lápis — paths do protótipo, com o filtro mdPencil (traço trêmulo e falhado). */
const RABISCO_PATHS = {
  espiral: { vb: "0 0 100 100", d: "M50 50 c6 -8 18 -2 14 8 c-4 12 -22 12 -26 -2 c-5 -18 18 -30 34 -20 c18 12 14 40 -6 48 c-24 9 -48 -10 -46 -34", cor: "#4a443c", w: 4.5, cap: "round" },
  sublinhado: { vb: "0 0 400 24", par: "none", d: "M4 14 C30 2,44 24,70 12 S110 2,136 13 S178 24,204 11 S246 2,272 13 S316 23,340 11 S380 6,396 12", cor: "#c8321e", w: 3, cap: "round" },
  estrela: { vb: "0 0 100 100", d: "M50 8 L75 86 L10 36 L90 39 L25 84 Z", cor: "#4a443c", w: 5, join: "round" },
  raio: { vb: "0 0 70 100", d: "M36 4 L10 50 L30 47 L18 96 L60 36 L38 39 L54 6 Z", cor: "#4a443c", w: 5, join: "round" },
  seta: { vb: "0 0 110 50", d: "M6 40 C28 8,66 4,98 22 M82 8 L100 23 L78 34", cor: "#4a443c", w: 4.5, cap: "round", join: "round" },
  carinha: { vb: "0 0 100 100", d: "M50 8 C78 6,94 28,92 52 C90 78,70 94,48 92 C22 90,6 72,8 48 C10 24,28 8,54 9 M30 34 l12 12 M42 34 l-12 12 M60 34 l12 12 M72 34 l-12 12 M30 66 C40 76,62 76,72 64", cor: "#4a443c", w: 4.5, cap: "round" },
  check: { vb: "0 0 44 44", d: "M5 23 L15 37 L40 3", cor: "#c8321e", w: 4.5, cap: "round", join: "round" },
  circulo: { vb: "0 0 200 100", par: "none", d: "M20 50 C18 20,60 6,110 10 C160 14,192 30,188 54 C184 82,140 96,96 94 C50 92,14 78,16 48 C18 26,52 12,96 10", cor: "#c8321e", w: 2.6, cap: "round", fixo: true },
};

function Rabisco({ tipo, className = "", largura }) {
  const r = RABISCO_PATHS[tipo];
  if (!r) return null;
  return (
    <svg className={`rab ${className}`} viewBox={r.vb} preserveAspectRatio={r.par} aria-hidden="true" focusable="false">
      <path
        d={r.d}
        fill="none"
        stroke={r.cor}
        strokeWidth={largura ?? r.w}
        strokeLinecap={r.cap}
        strokeLinejoin={r.join}
        vectorEffect={r.fixo ? "non-scaling-stroke" : undefined}
      />
    </svg>
  );
}

/* Filtros SVG que só funcionam como filtro de verdade: os que deformam o
   elemento (borda rasgada) ou o traço (lápis). A fibra e o encardido do
   protótipo viraram textura repetida no CSS — como filtro, rodavam sobre a
   área inteira de cada folha, e foi isso que travou o site no celular. */
function SvgFilters() {
  return (
    <svg className="defs" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="mdTearA" x="-4%" y="-4%" width="108%" height="108%">
        <feTurbulence type="fractalNoise" baseFrequency="0.014 0.045" numOctaves="3" seed="5" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="10" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="mdTearB" x="-4%" y="-4%" width="108%" height="108%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.09" numOctaves="2" seed="19" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="7" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="mdPencil" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="w" />
        <feDisplacementMap in="SourceGraphic" in2="w" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9" result="ga" />
        <feComposite in="d" in2="ga" operator="in" />
      </filter>
    </svg>
  );
}
