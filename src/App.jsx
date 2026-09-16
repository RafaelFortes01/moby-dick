import React, { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSYtRIgfIZgpnTPSHkxTqrvmElRCVSlzjChVBqwqQzdNNmmx2ZZgHZNTjwL_rWhOdLrrmjoCRB5lotd/pub?gid=0&single=true&output=csv";

// Troque pelos nomes de vocês dois (aparecem nas notas):
const NOME_VOCE = "Suum";
const NOME_AMIGO = "Magilla";

/* ---------- ajustes de exibição ---------- */
const NOTA_STYLE = "estrelas";   // "estrelas" | "numeros"
const SHOW_PRECOS = true;        // mostra quanto custou cada ingresso na setlist
const PAPEL_AMASSADO = 0.5;      // 0 a 1 — intensidade do amassado do papel

/* ---------- desenhos ----------
   Enquanto não chegam os desenhos, cada slot vira um placeholder tracejado.
   Pra colocar a arte: adicione `src` (arquivo em public/, ex: "/desenhos/caveira.png").
   Ex.: hero: { src: "/desenhos/caveira.png", alt: "caveira", label: "..." }          */
const DESENHOS = {
  hero: { label: "desenho a lápis / foto do show" },
  rank: { label: "desenho / foto" },
  topMelhor: { label: "foto do melhor show" },
  topTreta: { label: "rabisco da treta" },
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
const tally = (n) => "|".repeat(Math.max(0, n));
const up = (s) => String(s || "").toUpperCase();

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

export default function App() {
  const [rawRows, setRawRows] = useState(SHEET_CSV_URL ? null : SAMPLE_DATA);
  const [source, setSource] = useState(SHEET_CSV_URL ? "carregando" : "exemplo");
  const [query, setQuery] = useState("");

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

  const search = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const hits = past.filter((e) => bandsOf(e).some((b) => b.toLowerCase().includes(q)));
    const label = past.flatMap((e) => bandsOf(e)).find((b) => b.toLowerCase().includes(q)) || query.trim();
    return {
      label,
      count: `${hits.length}×`,
      hits: [...hits].reverse().map((e) => ({
        key: e.data + e.local,
        date: fmtShort(e.dateObj),
        place: `${e.local} · ${e.cidade}`,
        roleUp: e.evento ? "FESTIVAL" : (e.headliner && e.headliner.toLowerCase().includes(q) ? "HEADLINER" : "SUPORTE"),
      })),
    };
  }, [query, past]);

  // agrupa a setlist por ano, do mais recente pro mais antigo
  const years = useMemo(() => {
    const hist = {};
    [...events].reverse().forEach((e) => {
      const y = e.dateObj.getFullYear();
      (hist[y] = hist[y] || []).push(e);
    });
    return Object.entries(hist)
      .sort((a, b) => b[0] - a[0])
      .map(([y, shows], i) => ({
        key: y,
        label: `${i + 1}. ${y}`,
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
  const useStars = NOTA_STYLE === "estrelas";

  if (source === "carregando") {
    return (
      <>
        <PaperDefs />
        <Stage />
        <div className="loading">carregando o caderno…</div>
      </>
    );
  }

  return (
    <>
      <PaperDefs />
      <Stage />

      <div className="page">
        {/* abas de papel */}
        <nav className="tabs">
          <a className="tab tab--a" href="#arquivo">
            <span className="tab-paper" />
            <span className="fret fret--amarelo" />
            <span className="tab-label">setlist</span>
          </a>
          <a className="tab tab--b" href="#top">
            <span className="tab-paper" />
            <span className="fret fret--azul" />
            <span className="tab-label">top shows</span>
          </a>
          <a className="tab tab--c" href="#proximo">
            <span className="tab-paper" />
            <span className="fret fret--laranja" />
            <span className="tab-label">próximo</span>
          </a>
        </nav>

        {/* ---------- folha 1: capa + próximo show + números + busca ---------- */}
        <Paper id="proximo" variant="next">
          <div className="hero-head">
            <div className="hero-titles">
              <h1 className="brand">Moby Dick</h1>
              <div className="brand-sub">arquivo de shows · {NOME_VOCE} &amp; {NOME_AMIGO}</div>
              {source === "erro" && <div className="srcflag">a planilha não carregou — mostrando exemplo</div>}
            </div>
            <div className="hero-slot">
              <span className="tape tape--slot" />
              <ImageSlot slot={DESENHOS.hero} size={186} />
            </div>
          </div>

          <SectionLabel>1. PRÓXIMO SHOW</SectionLabel>

          {next ? (
            <div className="next">
              <div className="next-main">
                <div className="next-title">{titleOf(next)}</div>
                {lineupOf(next).length > 0 && (
                  <div className="next-lineup">
                    {isFest(next) ? "lineup: " : "com "}{lineupOf(next).join(" · ")}
                  </div>
                )}
                <div className="next-venue">{up(`${next.local} · ${next.cidade}`)}</div>
              </div>
              <div className="next-count">
                <div className="next-days">{nextCountdown}</div>
                <div className="next-meta">
                  <div className="next-unit">{nextCountdown === 1 ? "DIA" : "DIAS"}</div>
                  <div className="next-dow">{weekdayBR(next.dateObj)}</div>
                  <div className="next-date">
                    {up(`${next.dateObj.getDate()} de ${next.dateObj.toLocaleDateString("pt-BR", { month: "long" })} de ${next.dateObj.getFullYear()}`)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="next">
              <div className="next-main">
                <div className="next-title">nada marcado</div>
                <div className="next-lineup">sem show no radar. bora comprar ingresso.</div>
              </div>
            </div>
          )}

          <div className="stats">
            <div className="stat stat--a"><div className="stat-n">{past.length}</div><div className="stat-l">shows que a gente foi</div></div>
            <div className="stat stat--b"><div className="stat-n">{stats.ranking.length}</div><div className="stat-l">bandas vistas</div></div>
            <div className="stat stat--c"><div className="stat-n">{stats.venues}</div><div className="stat-l">casas de show</div></div>
            <div className="stat stat--d"><div className="stat-n stat-n--sm">{brl(stats.gasto)}</div><div className="stat-l">queimado em ingresso</div></div>
          </div>

          <div className="search">
            <div className="search-label">QUANTAS VEZES A GENTE VIU…</div>
            <label className="search-field">
              <span className="search-icon" aria-hidden>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="digita a banda aqui"
                spellCheck={false}
              />
            </label>
            {search && (
              <div className="search-result">
                <div className="search-line">
                  a gente viu <span className="search-band">{search.label}</span>{" "}
                  <span className="search-count">{search.count}</span>
                </div>
                <div className="search-hits">
                  {search.hits.map((h) => (
                    <div className="hit" key={h.key}>
                      <span className="hit-date">{h.date}</span>
                      <span className="hit-place">{h.place}</span>
                      <span className="dotline" />
                      <span className="hit-role">{h.roleUp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Paper>

        {/* ---------- folha 2: ranking + shows por ano ---------- */}
        <Paper variant="rank">
          <SectionLabel>2. MAIS TOCADAS AO VIVO</SectionLabel>
          <div className="rank-grid">
            <div className="rank-list">
              {stats.ranking.slice(0, 8).map(([band, n], i) => (
                <div className="rank-row" key={band}>
                  <span className="rank-pos">{String(i + 1).padStart(2, "0")}</span>
                  <span className="rank-name">{band}</span>
                  <span className="dotline" />
                  <span className="rank-tally">{tally(n)}</span>
                  <span className="rank-n">{n}×</span>
                </div>
              ))}
            </div>
            <div>
              <div className="mini-label">SHOWS POR ANO</div>
              <div className="years-list">
                {byYearEntries.map(([y, n]) => (
                  <div className="year-row" key={y}>
                    <span className="year-y">{y}</span>
                    <span className="year-tally">{tally(n)}</span>
                    <span className="dotline" />
                    <span className="year-n">{n}</span>
                  </div>
                ))}
              </div>
              <div className="rank-aside">
                <div className="rank-slot">
                  <span className="tape tape--slot" />
                  <ImageSlot slot={DESENHOS.rank} size={150} />
                </div>
                <div className="rank-aside-txt">cola aqui um rabisco do caderno, print do story, foto da pista…</div>
              </div>
            </div>
          </div>
        </Paper>

        {/* ---------- folha 3 (verde): top shows + treta ---------- */}
        <Paper id="top" variant="top">
          <div className="cassete">
            <span className="tape tape--cassete" />
            <div className="cassete-body">
              <div className="cassete-window">
                <span className="cassete-reel" />
                <span className="cassete-reel" />
                <span className="cassete-tape" />
              </div>
              <div className="cassete-label">fita do rolê</div>
            </div>
          </div>

          <div className="top-title">Top Shows</div>
          <div className="top-sub">nota do {NOME_VOCE} &amp; do {NOME_AMIGO}</div>

          <div className="top-list">
            {topShows.map((e, i) => (
              <div className="top-row" key={e.data + e.local}>
                <span className="top-pos">{String(i + 1).padStart(2, "0")}</span>
                <span className="top-mid">
                  <span className="top-name">{titleOf(e)}</span>
                  <span className="top-meta">{up(`${fmtShort(e.dateObj)} · ${e.local}`)}</span>
                </span>
                {useStars
                  ? <Stars nota={avgNota(e)} tone="verde" />
                  : <span className="top-nums">{fmtNota(e.notaVoce)} / {fmtNota(e.notaAmigo)}</span>}
                <span className="top-avg">{fmtNota(avgNota(e))}</span>
              </div>
            ))}
          </div>

          {treta && gapNota(treta) > 0 && (
            <div className="treta">
              <span className="treta-label">MAIOR TRETA</span>
              <span className="treta-mid">{titleOf(treta)} · {fmtShort(treta.dateObj)}</span>
              <span className="dotline dotline--verde" />
              <span className="treta-notas">
                {up(NOME_VOCE)} {fmtNota(treta.notaVoce)} × {fmtNota(treta.notaAmigo)} {up(NOME_AMIGO)}
              </span>
            </div>
          )}

          <div className="top-slots">
            <div className="top-slot top-slot--a">
              <span className="tape tape--slot" />
              <ImageSlot slot={DESENHOS.topMelhor} size={146} />
            </div>
            <div className="top-slot top-slot--b">
              <span className="tape tape--slot" />
              <ImageSlot slot={DESENHOS.topTreta} size={146} />
            </div>
          </div>
        </Paper>

        {/* ---------- folha 4: a setlist completa ---------- */}
        <Paper id="arquivo" variant="archive">
          <div className="arch-title">Setlist completa</div>
          <div className="arch-sub">{events.length} shows no caderno</div>

          {years.map((yr) => (
            <div className="yearblock" key={yr.key}>
              <div className="year-head">
                <span className="year-label">{yr.label}</span>
                <span className="dotline" />
                <span className="year-count">{yr.countUp}</span>
              </div>
              <div className="showlist">
                {yr.shows.map((e) => {
                  const future = e.dateObj >= hoje;
                  const lp = lineupOf(e);
                  const rated = avgNota(e) != null;
                  const desenho = DESENHOS_NA_SETLIST[e.data];
                  return (
                    <div className="show" key={e.data + e.local}>
                      <span className="show-check">{future ? "" : "✓"}</span>
                      <span className="show-mid">
                        <span className="show-titleline">
                          <span className="show-title">{titleOf(e)}</span>
                          {isFest(e) && <span className="badge badge--fest">FESTIVAL</span>}
                          {future && <span className="badge badge--soon">AINDA VAI ROLAR</span>}
                        </span>
                        {lp.length > 0 && (
                          <span className="show-lineup">{isFest(e) ? "lineup: " : "com "}{lp.join(" · ")}</span>
                        )}
                        <span className="show-place">
                          {up(`${e.local} · ${e.cidade}${e.setor ? ` · ${e.setor}` : ""}`)}
                        </span>
                      </span>
                      {desenho && (
                        <span className="show-slot">
                          <span className="tape tape--slot" />
                          <ImageSlot slot={desenho} size={120} />
                        </span>
                      )}
                      <span className="show-right">
                        {rated && useStars && <Stars nota={avgNota(e)} tone="bege" />}
                        {rated && !useStars && (
                          <span className="show-nums">{fmtNota(e.notaVoce)} / {fmtNota(e.notaAmigo)}</span>
                        )}
                        {SHOW_PRECOS && <span className="show-preco">{brl(e.preco)}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </Paper>

        {/* ---------- bilhete: regra da casa ---------- */}
        <Paper variant="rule">
          <span className="tape tape--rule" />
          <div className="rule-label">REGRA DA CASA</div>
          <p className="rule-text">
            Só entra show que a gente <span className="rule-em">foi de fato</span>. Fica de fora:
            ingresso comprado e não usado, emo revival, e compra cancelada — aka Bangers Open Air.
          </p>
        </Paper>
      </div>

      {/* ---------- HUD do controle ---------- */}
      <div className="hud">
        <div className="hud-btn hud-btn--static">
          <span className="hud-strum" />
          <span className="hud-txt">SCROLL</span>
        </div>
        <a className="hud-btn" href="#proximo">
          <span className="fret fret--verde" />
          <span className="hud-txt">PRÓXIMO</span>
        </a>
        <a className="hud-btn" href="#arquivo">
          <span className="fret fret--vermelho" />
          <span className="hud-txt">SETLIST</span>
        </a>
        <a className="hud-btn" href="#top">
          <span className="fret fret--azul" />
          <span className="hud-txt">TOP SHOWS</span>
        </a>
      </div>
    </>
  );
}

/* ---------- o palco (madeira, sujeira, vinheta) ---------- */
function Stage() {
  return (
    <div className="stage" aria-hidden>
      <div className="stage-wood" />
      <div className="stage-grain" />
      <div className="stage-light" />
      <div className="stage-grime" />
      <div className="stage-dirt" />
      <div className="scuff scuff--a"><span /><span /></div>
      <div className="scuff scuff--b"><span /><span /></div>
    </div>
  );
}

/* ---------- uma folha rasgada ---------- */
function Paper({ id, variant, children }) {
  return (
    <section id={id} className={`paper paper--${variant}`}>
      <div className="paper-torn">
        <div className="paper-sheet">
          <div className="paper-crumple" style={{ opacity: PAPEL_AMASSADO }} />
          <div className="paper-fiber" />
          <div className="paper-folds" />
        </div>
      </div>
      <div className="paper-body">{children}</div>
    </section>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="section-head">
      <span className="section-label">{children}</span>
      <span className="dotline" />
    </div>
  );
}

/* nota 0–10 vira 5 estrelas, com meia estrela: duas camadas sobrepostas,
   a de cima recortada na fração exata. */
function Stars({ nota, tone = "bege" }) {
  if (nota == null) return null;
  const pct = Math.max(0, Math.min(100, (nota / 10) * 100));
  return (
    <span className={`stars stars--${tone}`} role="img" aria-label={`${Math.round(nota * 10) / 10} de 10`}>
      <span className="stars-bg" aria-hidden>★★★★★</span>
      <span className="stars-fg" aria-hidden style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

/* espaço pra desenho: vira <img> assim que o slot ganhar um `src` */
function ImageSlot({ slot, size }) {
  if (!slot) return null;
  if (slot.src) {
    return <img className="slot-img" src={slot.src} alt={slot.alt || ""} style={{ width: size, height: size }} />;
  }
  return (
    <div className="slot" style={{ width: size, height: size }}>
      <span className="slot-txt">{slot.label}</span>
    </div>
  );
}

/* ---------- filtros que dão textura ao papel e à madeira ---------- */
function PaperDefs() {
  return (
    <svg className="defs" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="mdCrumple">
        <feTurbulence type="fractalNoise" baseFrequency="0.0055 0.009" numOctaves="5" seed="7" result="n" />
        <feDiffuseLighting in="n" lightingColor="#fff0d2" surfaceScale="4.2" result="l">
          <feDistantLight azimuth="238" elevation="32" />
        </feDiffuseLighting>
      </filter>
      <filter id="mdFiber">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="3" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <filter id="mdWood">
        <feTurbulence type="fractalNoise" baseFrequency="0.0012 0.07" numOctaves="5" seed="12" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <filter id="mdGrime">
        <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="4" seed="23" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.7 0 0 0 -0.62" />
      </filter>
      <filter id="mdTorn">
        <feTurbulence type="fractalNoise" baseFrequency="0.016 0.05" numOctaves="3" seed="5" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="11" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="mdTorn2">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="3" seed="19" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="8" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
