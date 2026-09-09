import React, { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Ticket, CalendarDays } from "lucide-react";
import Papa from "papaparse";


const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSYtRIgfIZgpnTPSHkxTqrvmElRCVSlzjChVBqwqQzdNNmmx2ZZgHZNTjwL_rWhOdLrrmjoCRB5lotd/pub?gid=0&single=true&output=csv";

// Troque pelos nomes de vocês dois (aparecem nas notas):
const NOME_VOCE = "Suum";
const NOME_AMIGO = "Magilla";

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
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
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
const supportsOf = (ev) => (ev.suporte || "").split(";").map((x) => x.trim()).filter(Boolean);
const bandsOf = (ev) => [ev.headliner, ...supportsOf(ev)].filter(Boolean);
const isFest = (ev) => !!ev.evento;
const titleOf = (ev) => ev.evento || ev.headliner;
const lineupOf = (ev) => (isFest(ev) ? bandsOf(ev) : supportsOf(ev)); // o que mostrar embaixo do título
const parseNota = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isFinite(n) ? Math.round(n) : null; };
const notasDe = (ev) => [ev.notaVoce, ev.notaAmigo].filter((n) => n != null);
const avgNota = (ev) => { const a = notasDe(ev); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; };
const gapNota = (ev) => (ev.notaVoce != null && ev.notaAmigo != null) ? Math.abs(ev.notaVoce - ev.notaAmigo) : null;
const fmtNota = (n) => (n == null ? "–" : String(Math.round(n)));

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
  const [source, setSource] = useState(SHEET_CSV_URL ? "carregando" : "exemplo"); // carregando | exemplo | live | erro
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

  const stats = useMemo(() => {
    const gasto = past.reduce((s, e) => s + e.preco, 0);
    const bandCount = {};
    past.forEach((e) => bandsOf(e).forEach((b) => { bandCount[b] = (bandCount[b] || 0) + 1; }));
    const ranking = Object.entries(bandCount).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const uniqueBands = ranking.length;
    const byYear = {};
    past.forEach((e) => { const y = e.dateObj.getFullYear(); byYear[y] = (byYear[y] || 0) + 1; });
    const venues = new Set(past.map((e) => e.local).filter(Boolean)).size;
    return { gasto, ranking, uniqueBands, byYear, venues };
  }, [past]);

  const search = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const hits = past.filter((e) => bandsOf(e).some((b) => b.toLowerCase().includes(q)));
    const label =
      past
        .flatMap((e) => bandsOf(e))
        .find((b) => b.toLowerCase().includes(q)) || query.trim();
    return { count: hits.length, hits: [...hits].reverse(), label };
  }, [query, past]);

  const nextCountdown = next ? daysBetween(next.dateObj, hoje) : null;

  const byYearEntries = Object.entries(stats.byYear).sort((a, b) => a[0] - b[0]);
  const maxYear = Math.max(1, ...byYearEntries.map(([, n]) => n));

  const grouped = useMemo(() => {
    const g = {};
    [...events].reverse().forEach((e) => {
      const y = e.dateObj.getFullYear();
      (g[y] = g[y] || []).push(e);
    });
    return Object.entries(g).sort((a, b) => b[0] - a[0]);
  }, [events]);

  // cada ano é uma "tier": número cronológico + a banda mais vista naquele ano
  const tierInfo = useMemo(() => {
    const byYear = {};
    events.forEach((e) => {
      const y = e.dateObj.getFullYear();
      (byYear[y] = byYear[y] || []).push(e);
    });
    const info = {};
    Object.keys(byYear)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((y, i) => {
        const count = {};
        byYear[y].forEach((e) => bandsOf(e).forEach((b) => { count[b] = (count[b] || 0) + 1; }));
        const top = Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
        info[y] = { n: i + 1, banda: top ? top[0] : "" };
      });
    return info;
  }, [events]);

  const topShows = useMemo(
    () =>
      past
        .filter((e) => avgNota(e) != null)
        .sort((a, b) => avgNota(b) - avgNota(a) || b.dateObj - a.dateObj)
        .slice(0, 5),
    [past]
  );

  const treta = useMemo(() => {
    const withGap = past.filter((e) => gapNota(e) != null);
    if (!withGap.length) return null;
    return withGap.reduce((m, e) => (gapNota(e) > gapNota(m) ? e : m));
  }, [past]);

  return (
    <div className="wrap">
      <PencilDefs />
      {source === "carregando" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#7d7a70", fontFamily: "'Architects Daughter', cursive", fontSize: "17px" }}>
          carregando shows…
        </div>
      )}
      {source !== "carregando" && (<>

      <header className="top">
        <div className="brand">
          <Wobble>MOBY DICK</Wobble>
        </div>

        {source === "erro" && <div className="srcflag err">planilha não carregou — mostrando exemplo</div>}
        {source === "exemplo" && <div className="srcflag">dados de exemplo</div>}
        <span className="serial">arquivo nº {events.length}</span>
      </header>

      {/* HERO — próximo show */}
      <section className="hero">
        <div className="eyebrow">próximo show</div>
        {next ? (
          <>
            <h1 className="hl">{titleOf(next)}</h1>
            {lineupOf(next).length > 0 && (
              <div className="supp">{isFest(next) ? "lineup: " : "com "}<Lineup ev={next} /></div>
            )}
            <div className="venue">
              <MapPin size={15} strokeWidth={2.4} /> {next.local} · {next.cidade}
            </div>
            <div className="count">
              <div className="cd">
                <span className="cdnum">{nextCountdown}</span>
                <span className="cdunit">{nextCountdown === 1 ? "dia" : "dias"}</span>
              </div>
              <div className="cdmeta">
                <div className="cddow">{weekdayBR(next.dateObj)}</div>
                <div className="cddate">
                  {next.dateObj.getDate()} de {next.dateObj.toLocaleDateString("pt-BR", { month: "long" })} de {next.dateObj.getFullYear()}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty">
            <h1 className="hl dim">nada marcado</h1>
            <p>Sem show no radar. Bora comprar ingresso.</p>
          </div>
        )}
      </section>

      {/* números */}
      <section className="strip">
        <Stat n={past.length} label="shows já fomos" />
        <Stat n={stats.uniqueBands} label="bandas vistas" />
        <Stat n={stats.venues} label="casas de show" />
        <Stat n={brl(stats.gasto)} label="gasto em ingressos" small />
      </section>

      {/* busca banda */}
      <section className="card searchcard">
        <label className="searchbar">
          <Search size={18} strokeWidth={2.4} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="quantas vezes vimos… (digite a banda)"
            spellCheck={false}
          />
        </label>
        {search && (
          <div className="result">
            {search.count > 0 ? (
              <>
                <div className="resline">
                  vocês viram <b>{search.label}</b> <span className="rx">{search.count}×</span>
                </div>
                <ul className="reslist">
                  {search.hits.map((e, i) => (
                    <li key={i}>
                      <span className="rd">{fmtShort(e.dateObj)}</span>
                      <span className="rr">{e.local} · {e.cidade}</span>
                      <span className="rrole">{e.headliner && e.headliner === matchName(e, query) ? "headliner" : (e.evento ? "festival" : "suporte")}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="resline dim">ainda não — “{query.trim()}” não tá no histórico.</div>
            )}
          </div>
        )}
      </section>

      {/* ranking + anos */}
      <section className="grid2">
        <div className="card">
          <div className="cardhead">mais vistas</div>
          <ol className="ranking">
            {stats.ranking.slice(0, 8).map(([band, n], i) => (
              <li key={band}>
                <span className="rkpos">{i + 1}</span>
                <span className="rkname">{band}</span>
                <span className="rkbar"><span style={{ width: `${(n / stats.ranking[0][1]) * 100}%` }} /></span>
                <span className="rkn">{n}×</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <Doodle kind="olho" className="dd-olho" />
          <div className="cardhead">shows por ano</div>
          <div className="years">
            {byYearEntries.map(([y, n]) => (
              <div className="yrow" key={y}>
                <span className="yy">{y}</span>
                <span className="ybar"><span style={{ width: `${(n / maxYear) * 100}%` }} /></span>
                <span className="yn">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* top shows por nota */}
      {topShows.length > 0 && (
        <section className="card topshows">
          <Doodle kind="raio" className="dd-raio" />
          <Doodle kind="palheta" className="dd-palheta" />
          <Doodle kind="estrela" className="dd-estrela" />
          <div className="cardhead">
            <span>top shows</span>
            <span className="dim">por nota</span>
          </div>
          <ol className="toplist">
            {topShows.map((e, i) => (
              <li key={i}>
                <span className="tpos">{i + 1}.</span>
                <span className="tmid">
                  <span className="tname">{titleOf(e)}</span>
                  <span className="tmeta">{fmtShort(e.dateObj)} · {e.cidade}</span>
                </span>
                <span className="tnotas">
                  <span className="tn"><em>{NOME_VOCE[0]}</em><Stars nota={e.notaVoce} /></span>
                  <span className="tn"><em>{NOME_AMIGO[0]}</em><Stars nota={e.notaAmigo} /></span>
                </span>
              </li>
            ))}
          </ol>
          {treta && gapNota(treta) > 0 && (
            <div className="treta">
              <span className="tretalabel">maior treta</span>
              <span className="tretamid">{titleOf(treta)} · {fmtShort(treta.dateObj)}</span>
              <span className="tretanotas">{NOME_VOCE} {fmtNota(treta.notaVoce)} × {fmtNota(treta.notaAmigo)} {NOME_AMIGO}</span>
            </div>
          )}
        </section>
      )}

      {/* histórico — assinatura estilo pôster de turnê */}
      <section className="card history">
        <Doodle kind="caveira" className="dd-caveira" />
        <Doodle kind="nota" className="dd-nota" />
        <Doodle kind="amp" className="dd-amp" />
        <Doodle kind="chifre" className="dd-chifre" />
        <Doodle kind="estrela" className="dd-estrela2" />
        <div className="cardhead">
          <span>setlist</span>
          <span className="dim"><CalendarDays size={13} /> {events.length} registros</span>
        </div>
        {grouped.map(([year, evs]) => (
          <div className="yearblock" key={year}>
            <div className="yearlabel">
              <span className="tiern">{tierInfo[year] ? tierInfo[year].n : "?"}.</span>
              <span className="tieryear"><Wobble>{String(year)}</Wobble></span>
              {tierInfo[year] && tierInfo[year].banda && (
                <span className="tierband">{tierInfo[year].banda}</span>
              )}
            </div>
            <ul className="showlist">
              {evs.map((e, i) => {
                const future = e.dateObj >= hoje;
                return (
                  <li className={"showrow" + (future ? " future" : "")} key={i}>
                    <span className="date">{fmtShort(e.dateObj)}</span>
                    <span className="mid">
                      <span className="hn">
                        {titleOf(e)}
                        {isFest(e) && <span className="fest">festival</span>}
                        {future && <span className="soon">em breve</span>}
                      </span>
                      {lineupOf(e).length > 0 && (
                        <span className="sn"><Lineup ev={e} /></span>
                      )}
                    </span>
                    <span className="place">
                      <span className="pv">{e.local}</span>
                      <span className="pc">{e.cidade}{e.setor ? ` · ${e.setor}` : ""}</span>
                      {avgNota(e) != null && (
                        <span className="rowscores">
                          <Stars nota={avgNota(e)} />
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <details className="howto">
        <summary>o que entra (e o que não entra) no arquivo?</summary>
        <p>
          Só entram shows que a gente <b>foi de fato</b>. Ficam de fora: shows que a gente
          comprou ingresso mas não foi, shows de emo revival, e shows cuja compra foi
          cancelada, aka Bangers Open Air
        </p>
      </details>

      <footer className="foot">
        <span className="frets" aria-hidden />
        <span className="footxt">
          <Ticket size={13} /> MOBY DICK — feito pra parar de perguntar “quantas vezes a gente viu essa banda?”
        </span>
      </footer>
      </>)}
    </div>
  );
}

function Stat({ n, label, small }) {
  return (
    <div className="stat">
      <div className={"statn" + (small ? " sm" : "")}>{n}</div>
      <div className="statl">{label}</div>
    </div>
  );
}

/* nota 0–10 vira 5 estrelas, com meia estrela: duas camadas sobrepostas,
   a de cima recortada na fração exata. */
function Stars({ nota }) {
  if (nota == null) return <span className="stars none">—</span>;
  const pct = Math.max(0, Math.min(100, (nota / 10) * 100));
  return (
    <span className="stars" role="img" aria-label={`${Math.round(nota * 10) / 10} de 10`}>
      <span className="stbg" aria-hidden>★★★★★</span>
      <span className="stfg" aria-hidden style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

/* letras tortas — inclinação determinística (mesma string, mesma inclinação sempre) */
function Wobble({ children }) {
  const t = String(children ?? "");
  return (
    <span className="wob">
      {t.split("").map((c, i) =>
        c === " " ? (
          <span key={i} className="wsp">{" "}</span>
        ) : (
          <span
            key={i}
            style={{
              "--r": `${((i * 37 + c.charCodeAt(0) * 13) % 9) - 4}deg`,
              "--y": `${((i * 23 + c.charCodeAt(0) * 7) % 5) - 2}px`,
            }}
          >
            {c}
          </span>
        )
      )}
    </span>
  );
}

/* o filtro que dá aos rabiscos o aspecto de grafite: traço trêmulo (displacement)
   e falhado (o ruído vira máscara alpha, abrindo buracos no traço). */
function PencilDefs() {
  return (
    <svg className="pencildefs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="grafite" x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="11" result="warpNoise" />
          <feDisplacementMap in="SourceGraphic" in2="warpNoise" scale="3.4" xChannelSelector="R" yChannelSelector="G" result="warped" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="5" result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    1.5 0 0 0 -0.12"
            result="grainMask"
          />
          <feComposite in="warped" in2="grainMask" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

/* rabiscos a lápis espalhados pela folha */
const DOODLES = {
  olho: { vb: "0 0 100 62", d: "M6 31c14-18 30-26 44-26s30 8 44 26c-14 18-30 26-44 26S20 49 6 31zM50 18a13 13 0 100 26 13 13 0 100-26zM50 26a5 5 0 100 10 5 5 0 100-10M50 5V0M79 12l4-6M21 12l-4-6M94 31h6M0 31h6" },
  caveira: { vb: "0 0 72 88", d: "M36 4C19 4 8 16 8 32c0 10 4 16 8 20v10h40V52c4-4 8-10 8-20 0-16-11-28-28-28zM24 26a7 7 0 100 14 7 7 0 100-14M48 26a7 7 0 100 14 7 7 0 100-14M36 44v7M31 55h10M27 62v12M36 62v14M45 62v12" },
  palheta: { vb: "0 0 56 66", d: "M28 4C13 4 4 13 4 24c0 14 14 29 24 38 10-9 24-24 24-38C52 13 43 4 28 4zM18 20c4-4 12-6 18-4" },
  raio: { vb: "0 0 46 74", d: "M27 3 7 40h13l-4 31 22-42H24z" },
  nota: { vb: "0 0 58 66", d: "M22 50V9l28-6v41M22 50a10 8 0 10-20 0 10 8 0 1020 0M50 44a10 8 0 10-20 0 10 8 0 1020 0M22 19l28-6" },
  amp: { vb: "0 0 76 86", d: "M8 14h60v66H8zM38 32a16 16 0 100 32 16 16 0 100-32M38 42a6 6 0 100 12 6 6 0 100-12M24 6h28M16 22h10M52 22h10" },
  estrela: { vb: "0 0 54 52", d: "M27 3 34 19l17 1.5-13 11.5 4 17-15-9.5-15 9.5 4-17L3 20.5 20 19z" },
  chifre: { vb: "0 0 62 76", d: "M12 72V44a6 6 0 0112 0v-8M24 36V8a6 6 0 0112 0v30M36 38V26a6 6 0 0112 0v14M48 44v-6M12 60c0 10 8 14 18 14s20-6 20-18V38" },
};

function Doodle({ kind, className = "" }) {
  const d = DOODLES[kind];
  if (!d) return null;
  return (
    <svg className={`doodle ${className}`} viewBox={d.vb} aria-hidden="true" focusable="false">
      <path
        d={d.d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#grafite)"
      />
    </svg>
  );
}

function Lineup({ ev }) {
  const bands = lineupOf(ev);
  return (
    <>
      {bands.map((b, i) => (
        <React.Fragment key={b + i}>
          {i > 0 && " · "}
          <span className={ev.headliner && b === ev.headliner ? "lead" : ""}>{b}</span>
        </React.Fragment>
      ))}
    </>
  );
}

const fmtShort = (dt) => `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}`;
function matchName(ev, q) {
  const s = q.trim().toLowerCase();
  return bandsOf(ev).find((b) => b.toLowerCase().includes(s)) || "";
}
