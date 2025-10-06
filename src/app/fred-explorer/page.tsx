"use client";

import { useEffect, useMemo, useState } from "react";

type AnyRecord = Record<string, unknown>;

type FredResponse = {
  columns: string[];
  rows: AnyRecord[];
  dictionary: Record<string, string>;
};

type Option = { value: string; label: string };

function uniqueValues(rows: AnyRecord[], key: string): string[] {
  const s = new Set<string>();
  for (const r of rows) {
    const v = String(r[key] ?? "");
    if (v) s.add(v);
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function formatSig4(value: unknown): string {
  const n = toNumber(value);
  if (n == null) return "";
  const s = Number(n).toPrecision(4);
  // Trim trailing zeros where possible (avoid touching exponent notation)
  if (!/e/i.test(s)) {
    return s.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, ".0").replace(/\.$/u, "");
  }
  return s;
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const widthPct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2 bg-black/10 dark:bg-white/10 rounded">
      <div className="h-2 bg-black/60 dark:bg-white/60 rounded" style={{ width: `${widthPct}%` }} />
    </div>
  );
}

function parseApaRef(ref: string): { firstAuthorLast?: string; year?: string; journal?: string } {
  const result: { firstAuthorLast?: string; year?: string; journal?: string } = {};
  const trimmed = (ref || "").trim();
  if (!trimmed) return result;

  // Strip any DOI/link tail to avoid confusing parsing
  const noDoi = trimmed.split(/https?:\/\//i)[0].trim();

  // First author last name: text before first comma (authors segment)
  const authorsSegment = noDoi.split("(")[0] || noDoi;
  const firstCommaIdx = authorsSegment.indexOf(",");
  if (firstCommaIdx > 0) {
    result.firstAuthorLast = authorsSegment.slice(0, firstCommaIdx).trim();
  } else {
    result.firstAuthorLast = authorsSegment.trim().split(/\s+/).pop();
  }

  // Year: prefer (YYYY); fallback to last 4-digit year token in string
  const yearParen = noDoi.match(/\((\d{4})\)/);
  if (yearParen) {
    result.year = yearParen[1];
  } else {
    const yearLoose = noDoi.match(/\b(19|20)\d{2}\b(?!.*\b(19|20)\d{2}\b)/); // last year
    if (yearLoose) result.year = yearLoose[0].slice(-4);
  }

  // Journal: multiple heuristics
  // 1) APA-like: (Year). Title. Journal,
  const m1 = noDoi.match(/\(\d{4}\)\.?\s*[^.]+\.\s*([^,]+),/);
  if (m1 && m1[1]) {
    result.journal = m1[1].trim();
  }
  // 2) After authors then title then journal (when year not in parentheses), fallback pattern: 
  if (!result.journal) {
    const afterAuthors = noDoi.slice((authorsSegment || "").length).trim();
    const sentences2 = afterAuthors.split(/[.!?]\s+/).map((s) => s.trim()).filter(Boolean);
    let candidate2 = sentences2.length >= 2 ? sentences2[1] : sentences2[0] || "";
    candidate2 = candidate2.replace(/^,\s*/, "");
    const commaIdx2 = candidate2.indexOf(",");
    if (commaIdx2 > 0) candidate2 = candidate2.slice(0, commaIdx2).trim();
    candidate2 = candidate2.replace(/[.:]+$/, "").trim();
    if (candidate2) result.journal = candidate2;
  }
  // 3) Last resort: look for capitalized phrase before a comma near end
  if (!result.journal) {
    const tail = noDoi.slice(-200);
    const m3 = tail.match(/([A-Z][A-Za-z&\-: ]+)(?=,\s*(\d{4}|\d+|doi|https?:))/);
    if (m3 && m3[1]) result.journal = m3[1].trim();
  }

  return result;
}

function toDoiUrl(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.startsWith("http")) return s;
  if (/^10\.\S+/.test(s)) return `https://doi.org/${s}`;
  return null;
}

function extractDoiFromRef(ref: string): string | null {
  if (!ref) return null;
  const m = ref.match(/https?:\/\/doi\.org\/\S+/);
  return m ? m[0] : null;
}

export default function FredExplorerPage() {
  const [data, setData] = useState<FredResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [discipline, setDiscipline] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/fred", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FredResponse;
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const disciplineOptions: Option[] = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const r of data.rows) {
      const key = String(r.discipline ?? "");
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const entries = Array.from(counts.entries()).filter(([k]) => k !== "");
    entries.sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    const sortedValues = entries.map(([k]) => k);
    const values = ["", ...sortedValues];
    return values.map((v) => {
      if (v === "") return { value: v, label: "All disciplines" };
      const c = counts.get(v) || 0;
      return { value: v, label: `${v} (${c})` };
    });
  }, [data]);

  const resultOptions: Option[] = useMemo(() => {
    if (!data) return [];
    return ["", ...uniqueValues(data.rows, "result")].map((v) => ({ value: v, label: v || "All results" }));
  }, [data]);

  const filteredRows = useMemo(() => {
    if (!data) return [] as AnyRecord[];
    return data.rows.filter((r) => {
      if (discipline && String(r.discipline ?? "") !== discipline) return false;
      if (result && String(r.result ?? "") !== result) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${r.description ?? ""} ${r.tags ?? ""} ${r.ref_original ?? ""} ${r.ref_replication ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      // Require sample sizes and effect sizes (r) for both original and replication
      const nO = toNumber(r.n_original);
      const nR = toNumber(r.n_replication);
      const eO = toNumber(r.es_original);
      const eR = toNumber(r.es_replication);
      if (nO == null || nR == null || eO == null || eR == null) return false;
      return true;
    });
  }, [data, discipline, result, search]);

  const stat = useMemo(() => {
    const n = filteredRows.length;
    let success = 0;
    let failure = 0;
    let inconclusive = 0;
    for (const r of filteredRows) {
      const res = String(r.result ?? "").toLowerCase();
      const eR = toNumber(r.es_replication);
      if (res.includes("inconcl")) {
        inconclusive++;
      } else if (eR != null && eR < 0) {
        failure++;
      } else {
        success++;
      }
    }
    const pct = (v: number) => (n > 0 ? Math.round((v / n) * 1000) / 10 : 0);
    return { n, success, failure, inconclusive, pctSuccess: pct(success), pctFailure: pct(failure), pctInconclusive: pct(inconclusive) };
  }, [filteredRows]);


  if (loading) {
    return (
      <main className="min-h-screen px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10">
        <p className="opacity-70">Loading FReD data…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10">
        <p className="text-red-600 dark:text-red-400">Failed to load: {error || "No data"}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">FReD Explorer (experimental - still has some minor bugs!!)</h1>
        <p className="opacity-80">
          Data shown here are derived from the <a className="underline" href="https://forrt.org/apps/fred_explorer.html" target="_blank" rel="noreferrer">FReD replication dataset</a> as described in <a className="underline" href="https://openpsychologydata.metajnl.com/articles/10.5334/jopd.101" target="_blank" rel="noreferrer">Röseler et al., <em>Journal of Open Psychology Data</em>, 12: 8, pp. 1–23</a>.  Repository link: <a className="underline" href="https://osf.io/9r62x" target="_blank" rel="noreferrer">https://osf.io/9r62x</a> .
        </p>
        <p className="opacity-80">
          Data is © 2024 The Author(s) and licensed under <a className="underline" href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International (CC‑BY 4.0)</a>. You must credit the original authors and source if you use these data.
        </p>
      </div>

      {/* Controls */}
      <section className="grid md:grid-cols-4 gap-4">
        <div className="col-span-1">
          <label className="text-sm opacity-70">Discipline</label>
          <select
            className="block w-full mt-1 border rounded px-2 py-1 bg-transparent"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
          >
            {disciplineOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="text-sm opacity-70">Result</label>
          <select
            className="block w-full mt-1 border rounded px-2 py-1 bg-transparent"
            value={result}
            onChange={(e) => setResult(e.target.value)}
          >
            {resultOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-sm opacity-70">Search description, tags, or references</label>
          <input
            className="block w-full mt-1 border rounded px-2 py-1 bg-transparent"
            placeholder="e.g., Anchoring, amygdala, Psychological Science"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Summary + Scatter */}
      <section className="grid md:grid-cols-4 gap-4">
        <div className="border rounded p-4 col-span-1">
          <div className="text-sm opacity-70">Study Replications</div>
          <div className="text-3xl font-semibold">{stat.n}</div>
        </div>
        <div className="border rounded p-4 col-span-1">
          <div className="text-sm opacity-70">Outcome mix</div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm">Success</div>
              <div className="flex-1"><MiniBar value={stat.pctSuccess} max={100} /></div>
              <div className="w-24 text-right text-sm">{stat.success} ({stat.pctSuccess}%)</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm">Failure</div>
              <div className="flex-1"><MiniBar value={stat.pctFailure} max={100} /></div>
              <div className="w-24 text-right text-sm">{stat.failure} ({stat.pctFailure}%)</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm">Inconcl.</div>
              <div className="flex-1"><MiniBar value={stat.pctInconclusive} max={100} /></div>
              <div className="w-24 text-right text-sm">{stat.inconclusive} ({stat.pctInconclusive}%)</div>
            </div>
          </div>
        </div>
        <div className="border rounded p-4 col-span-2">
          <div className="text-sm opacity-70">Replication Effect Size vs Original Effect Size (Converted to Pearson&apos;s r)</div>
          <div className="mt-2">
            <InlineScatter rows={filteredRows} />
          </div>
        </div>
      </section>

      {/* Data table */}
      <section className="border rounded">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-black/5 dark:bg-white/5">
                <th className="text-right p-2">#</th>
                <th className="text-left p-2">Original publication</th>
                <th className="text-left p-2">Replication publication</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Discipline</th>
                <th className="text-left p-2">Result</th>
                <th className="text-right p-2">n (orig)</th>
                <th className="text-right p-2">n (rep)</th>
                <th className="text-right p-2">ES (orig)</th>
                <th className="text-right p-2">ES (rep)</th>
                <th className="text-right p-2">r(orig)</th>
                <th className="text-right p-2">r(rep)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 2000).map((r, i) => {
                const nO = toNumber(r.n_original);
                const nR = toNumber(r.n_replication);
                const eO = toNumber(r.es_original);
                const eR = toNumber(r.es_replication);
                const esOVal = r.es_orig_value as number | string | undefined;
                const esOType = r.es_orig_estype as string | undefined;
                const esRVal = r.es_rep_value as number | string | undefined;
                const esRType = r.es_rep_estype as string | undefined;
                const refO = String(r.ref_original || "");
                const refR = String(r.ref_replication || "");
                const parsedO = parseApaRef(refO);
                const parsedR = parseApaRef(refR);
                const journalO = String(r.orig_journal || parsedO.journal || "");
                const doiO = toDoiUrl(r.doi_original) || extractDoiFromRef(refO);
                const doiR = toDoiUrl(r.doi_replication) || extractDoiFromRef(refR);
                return (
                  <tr key={i} className="border-b hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="align-top p-2 text-right">{i + 1}</td>
                    <td className="align-top p-2" style={{ width: 240 }}>
                      {doiO ? (
                        <a className="underline" href={doiO} target="_blank" rel="noreferrer" title={refO}>
                          {(parsedO.firstAuthorLast || "").trim()}{parsedO.firstAuthorLast ? " et al." : ""}{journalO || parsedO.year ? ", " : ""}{parsedO.journal || journalO || ""}{(parsedO.journal || journalO) && parsedO.year ? ", " : ""}{parsedO.year || ""}
                        </a>
                      ) : (
                        <span title={refO} className="opacity-80">
                          {(parsedO.firstAuthorLast || "").trim()}{parsedO.firstAuthorLast ? " et al." : ""}{journalO || parsedO.year ? ", " : ""}{parsedO.journal || journalO || ""}{(parsedO.journal || journalO) && parsedO.year ? ", " : ""}{parsedO.year || ""}
                        </span>
                      )}
                    </td>
                    <td className="align-top p-2" style={{ width: 240 }}>
                      {doiR ? (
                        <a className="underline" href={doiR} target="_blank" rel="noreferrer" title={refR}>
                          {(parsedR.firstAuthorLast || "").trim()}{parsedR.firstAuthorLast ? " et al." : ""}{parsedR.journal || parsedR.year ? ", " : ""}{parsedR.journal || ""}{parsedR.journal && parsedR.year ? ", " : ""}{parsedR.year || ""}
                        </a>
                      ) : (
                        <span title={refR} className="opacity-80">
                          {(parsedR.firstAuthorLast || "").trim()}{parsedR.firstAuthorLast ? " et al." : ""}{parsedR.journal || parsedR.year ? ", " : ""}{parsedR.journal || ""}{parsedR.journal && parsedR.year ? ", " : ""}{parsedR.year || ""}
                        </span>
                      )}
                    </td>
                    <td className="align-top p-2">
                      <div className="font-medium">{String(r.description || r.tags || "—")}</div>
                      <div className="text-xs opacity-70 mt-1">{String(r.claim_text_orig || "")}</div>
                    </td>
                    <td className="align-top p-2">{String(r.discipline || "")}</td>
                    <td className="align-top p-2">{String(r.result || "")}</td>
                    <td className="align-top p-2 text-right">{nO ?? ""}</td>
                    <td className="align-top p-2 text-right">{nR ?? ""}</td>
                    <td className="align-top p-2 text-right">{esOVal != null && esOVal !== "" ? `${formatSig4(esOVal)}${esOType ? ` ${esOType}` : ""}` : ""}</td>
                    <td className="align-top p-2 text-right">{esRVal != null && esRVal !== "" ? `${formatSig4(esRVal)}${esRType ? ` ${esRType}` : ""}` : ""}</td>
                    <td className="align-top p-2 text-right">{formatSig4(eO)}</td>
                    <td className="align-top p-2 text-right">{formatSig4(eR)}</td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-6 text-center opacity-70">No rows</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-2 text-xs opacity-60">Showing {Math.min(filteredRows.length, 2000)} of {filteredRows.length} rows.</div>
      </section>

      {/* Attribution & License */}
      <section className="border rounded p-4 text-sm space-y-2">
        <div className="font-medium">Attribution and License</div>
        <p className="opacity-80">
          Data shown here are derived from the <a className="underline" href="https://forrt.org/apps/fred_explorer.html" target="_blank" rel="noreferrer">FReD replication dataset</a> as described in <a className="underline" href="https://openpsychologydata.metajnl.com/articles/10.5334/jopd.101" target="_blank" rel="noreferrer">Röseler et al., <em>Journal of Open Psychology Data</em>, 12: 8, pp. 1–23</a>. DOI: https://doi.org/10.5334/jopd.101. Repository link: <a className="underline" href="https://osf.io/9r62x" target="_blank" rel="noreferrer">https://osf.io/9r62x</a> (DOI: https://doi.org/10.17605/OSF.IO/9R62X).
        </p>
        <p className="opacity-80">
          © 2024 The Author(s). Licensed under Creative Commons Attribution 4.0 International (CC‑BY 4.0). You must credit the original author(s) and source. See <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">https://creativecommons.org/licenses/by/4.0/</a> for terms.
        </p>
        <p className="opacity-70">
          Please cite the article above and the most recent OSF version when using these data.
        </p>
      </section>

      
    </main>
  );
}

function InlineScatter({ rows }: { rows: AnyRecord[] }) {
  const width = 600;
  const height = 220;
  const margin = { top: 10, right: 10, bottom: 30, left: 30 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const pts = rows
    .map((r) => {
      const o = toNumber(r.es_original);
      const rv = toNumber(r.es_replication);
      if (o == null || rv == null) return null;
      // Normalize direction: make original positive and flip replication accordingly
      const oAdj = o >= 0 ? o : -o;
      const rAdj = o >= 0 ? rv : -rv;
      const res = String(r.result || "").toLowerCase();
      return { o: oAdj, r: rAdj, desc: String(r.description || r.tags || ""), res };
    })
    .filter(Boolean) as Array<{ o: number; r: number; desc: string; res: string }>;

  // Fixed domains with custom minima and 0.25 tick increments
  const xMin: number = -0.1;
  const xMax: number = 1;
  const yMin: number = -0.75;
  const yMax: number = 1;
  const x = (v: number) => {
    if (xMax === xMin) return innerW / 2;
    return ((v - xMin) / (xMax - xMin)) * innerW;
  };
  const y = (v: number) => {
    if (yMax === yMin) return innerH / 2;
    return innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  };
  const allTicks: number[] = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
  const xTicks = allTicks.filter((t) => t >= xMin && t <= xMax);
  const yTicks = allTicks.filter((t) => t >= yMin && t <= yMax);

  function color(res: string): string {
    if (res.includes("success")) return "#10b981"; // green
    if (res.includes("failure") || res.includes("reversal")) return "#f87171"; // red-ish
    return "#9ca3af"; // gray (inconclusive/other)
  }

  function shouldGrey(o: number, r: number, res: string): boolean {
    // Quick fix: if marked success but replication effect is negative while original is positive, shade grey
    return res.includes("success") && o > 0 && r < 0;
  }

  return (
    <div className="relative">
      <svg width={width} height={height} className="max-w-full">
        <g transform={`translate(${margin.left},${margin.top})`}>
          <rect x={0} y={0} width={innerW} height={innerH} fill="#f3f4f6" />
          {/* axes ticks */}
          {xTicks.map((t) => (
            <g key={`x-${t}`} transform={`translate(${x(t)},${innerH})`}>
              <line y1={0} y2={6} stroke="#111827" strokeWidth={1} />
              <text y={20} textAnchor="middle" className="text-xs fill-current" style={{ opacity: 0.7 }}>{t}</text>
            </g>
          ))}
          {yTicks.map((t) => (
            <g key={`y-${t}`} transform={`translate(0,${y(t)})`}>
              <line x1={-6} x2={0} stroke="#111827" strokeWidth={1} />
              <text x={-10} dy="0.32em" textAnchor="end" className="text-xs fill-current" style={{ opacity: 0.7 }}>{t}</text>
            </g>
          ))}
          {/* y=x within overlapping domain */}
          {(() => {
            const tMin = Math.max(xMin, yMin);
            const tMax = Math.min(xMax, yMax);
            return (
              <line x1={x(tMin)} y1={y(tMin)} x2={x(tMax)} y2={y(tMax)} stroke="#6b7280" strokeDasharray="4 4" />
            );
          })()}

          
          {/* points */}
          {pts.map((p, i) => {
            const fill = shouldGrey(p.o, p.r, p.res) ? "#9ca3af" : color(p.res);
            return (
              <g key={i} transform={`translate(${x(p.o)},${y(p.r)})`}>
                <title>{p.desc}</title>
                <circle r={3} fill={fill} fillOpacity={0.85} />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded" style={{ background: "#10b981" }} />
          <span>Success</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded" style={{ background: "#f87171" }} />
          <span>Failure</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded" style={{ background: "#9ca3af" }} />
          <span>Inconclusive</span>
        </div>
      </div>
    </div>
  );
}


