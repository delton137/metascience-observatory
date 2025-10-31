"use client";

import { useEffect, useMemo, useState } from "react";
import { ReplicationsNavbar } from "@/components/ReplicationsNavbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";

type AnyRecord = Record<string, unknown>;

type FredResponse = {
  columns: string[];
  rows: AnyRecord[];
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
  const noDoi = trimmed.split(/https?:\/\//i)[0].trim();
  const authorsSegment = noDoi.split("(")[0] || noDoi;
  const firstCommaIdx = authorsSegment.indexOf(",");
  if (firstCommaIdx > 0) {
    result.firstAuthorLast = authorsSegment.slice(0, firstCommaIdx).trim();
  } else {
    result.firstAuthorLast = authorsSegment.trim().split(/\s+/).pop();
  }
  const yearParen = noDoi.match(/\((\d{4})\)/);
  if (yearParen) {
    result.year = yearParen[1];
  } else {
    const yearLoose = noDoi.match(/\b(19|20)\d{2}\b(?!.*\b(19|20)\d{2}\b)/);
    if (yearLoose) result.year = yearLoose[0].slice(-4);
  }
  const m1 = noDoi.match(/\(\d{4}\)\.?\s*[^.]+\.\s*([^,]+),/);
  if (m1 && m1[1]) {
    result.journal = m1[1].trim();
  }
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

type ColumnKey = 
  | "index"
  | "original_citation_html"
  | "replication_citation_html"
  | "description"
  | "discipline"
  | "result"
  | "original_n"
  | "replication_n"
  | "original_es_r"
  | "replication_es_r"
  | "original_es_type"
  | "replication_es_type"
  | "original_authors"
  | "replication_authors"
  | "original_title"
  | "replication_title"
  | "original_journal"
  | "replication_journal"
  | "original_volume"
  | "replication_volume"
  | "original_issue"
  | "replication_issue"
  | "original_pages"
  | "replication_pages"
  | "original_year"
  | "replication_year"
  | "original_doi"
  | "replication_doi"
  | "tags"
  | "validated"
  | "validated_person";

const ALL_COLUMNS: Array<{ key: ColumnKey; label: string }> = [
  { key: "index", label: "#" },
  { key: "original_citation_html", label: "Original publication" },
  { key: "replication_citation_html", label: "Replication publication" },
  { key: "description", label: "Description" },
  { key: "discipline", label: "Discipline" },
  { key: "result", label: "Result" },
  { key: "original_n", label: "N (orig)" },
  { key: "replication_n", label: "N (rep)" },
  { key: "original_es_r", label: "ES (orig)" },
  { key: "replication_es_r", label: "ES (rep)" },
  { key: "original_es_type", label: "ES type (orig)" },
  { key: "replication_es_type", label: "ES type (rep)" },
  { key: "original_authors", label: "Original authors" },
  { key: "replication_authors", label: "Replication authors" },
  { key: "original_title", label: "Original title" },
  { key: "replication_title", label: "Replication title" },
  { key: "original_journal", label: "Original journal" },
  { key: "replication_journal", label: "Replication journal" },
  { key: "original_volume", label: "Original volume" },
  { key: "replication_volume", label: "Replication volume" },
  { key: "original_issue", label: "Original issue" },
  { key: "replication_issue", label: "Replication issue" },
  { key: "original_pages", label: "Original pages" },
  { key: "replication_pages", label: "Replication pages" },
  { key: "original_year", label: "Original year" },
  { key: "replication_year", label: "Replication year" },
  { key: "original_doi", label: "Original DOI" },
  { key: "replication_doi", label: "Replication DOI" },
  { key: "tags", label: "Tags" },
  { key: "validated", label: "Human Validated" },
  { key: "validated_person", label: "Validated Person" },
];

const DEFAULT_COLUMNS: ColumnKey[] = [
  "index",
  "original_citation_html",
  "replication_citation_html",
  "description",
  "discipline",
  "result",
  "original_n",
  "replication_n",
  "original_es_r",
  "replication_es_r",
  "validated",
];

export default function ReplicationsDatabasePage() {
  const [data, setData] = useState<FredResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [discipline, setDiscipline] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(DEFAULT_COLUMNS)
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);

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
        const hay = `${r.description ?? ""} ${r.tags ?? ""} ${r.original_citation_html ?? ""} ${r.replication_citation_html ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      const nO = toNumber(r.original_n ?? r.n_original);
      const nR = toNumber(r.replication_n ?? r.n_replication);
      const eO = toNumber(r.original_es_r ?? r.es_original);
      const eR = toNumber(r.replication_es_r ?? r.es_replication);
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
      const res = String(r.result ?? "").trim().toLowerCase();
      if (res === "success") success++;
      else if (res === "failure") failure++;
      else inconclusive++; // Includes "inconclusive" and any other/empty values
    }
    const pct = (v: number) => (n > 0 ? Math.round((v / n) * 1000) / 10 : 0);
    return { n, success, failure, inconclusive, pctSuccess: pct(success), pctFailure: pct(failure), pctInconclusive: pct(inconclusive) };
  }, [filteredRows]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <ReplicationsNavbar />
        <main className="pt-24 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10">
          <div className="mx-auto max-w-[90%]">
            <p className="opacity-70">Loading data…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <ReplicationsNavbar />
        <main className="pt-24 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10">
          <div className="mx-auto max-w-[90%]">
            <p className="text-red-600 dark:text-red-400">Failed to load: {error || "No data"}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ReplicationsNavbar />
      <main className="pt-24 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-10">


      {/* Controls */}
      <section className="mx-auto max-w-[90%] mt-6">
        <div className="grid gap-3 md:grid-cols-3 items-end">
          <div className="md:col-span-1">
            <label htmlFor="discipline" className="block text-sm font-medium opacity-80 mb-1">Discipline</label>
            <select
              id="discipline"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {disciplineOptions.map((opt) => (
                <option key={opt.value || "__all"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium opacity-80 mb-1">Search description, tags, or references</label>
            <Input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, tags, or references"
              className="h-10"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90%] grid md:grid-cols-4 gap-4 mt-6">
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
          <div className="text-sm opacity-70">Replication Effect Size vs Original Effect Size (Converted to Pearson's r)</div>
          <div className="mt-2">
            <InlineScatter rows={filteredRows} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90%] border rounded mt-6">
        <div className="p-2 border-b flex items-center justify-between">
          <h3 className="font-medium">Data Table</h3>
          <div className="relative">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="px-3 py-1 text-sm border rounded hover:bg-black/5 dark:hover:bg-white/5"
            >
              Columns ({visibleColumns.size})
            </button>
            {showColumnSelector && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowColumnSelector(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-background border rounded shadow-lg z-20 p-3 max-h-96 overflow-y-auto">
                  <div className="mb-2 text-xs font-semibold opacity-70">Select columns to display</div>
                  {ALL_COLUMNS.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 p-1 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={(e) => {
                          const newSet = new Set(visibleColumns);
                          if (e.target.checked) {
                            newSet.add(col.key);
                          } else {
                            newSet.delete(col.key);
                          }
                          setVisibleColumns(newSet);
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                  <div className="mt-2 pt-2 border-t flex gap-2">
                    <button
                      onClick={() => setVisibleColumns(new Set(DEFAULT_COLUMNS))}
                      className="text-xs px-2 py-1 border rounded hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setVisibleColumns(new Set(ALL_COLUMNS.map(c => c.key)))}
                      className="text-xs px-2 py-1 border rounded hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Select All
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto h-[calc(100vh-400px)] max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-background dark:bg-background">
                {visibleColumns.has("index") && <th className="text-right p-2">#</th>}
                {visibleColumns.has("original_citation_html") && <th className="text-left p-2">Original publication</th>}
                {visibleColumns.has("replication_citation_html") && <th className="text-left p-2">Replication publication</th>}
                {visibleColumns.has("description") && <th className="text-left p-2">Description</th>}
                {visibleColumns.has("discipline") && <th className="text-left p-2">Discipline</th>}
                {visibleColumns.has("result") && <th className="text-left p-2">Result</th>}
                {visibleColumns.has("original_n") && <th className="text-right p-2">N (orig)</th>}
                {visibleColumns.has("replication_n") && <th className="text-right p-2">N (rep)</th>}
                {visibleColumns.has("original_es_r") && <th className="text-right p-2">ES (orig)</th>}
                {visibleColumns.has("replication_es_r") && <th className="text-right p-2">ES (rep)</th>}
                {visibleColumns.has("original_es_r") && <th className="text-right p-2">r(orig)</th>}
                {visibleColumns.has("replication_es_r") && <th className="text-right p-2">r(rep)</th>}
                {visibleColumns.has("original_es_type") && <th className="text-right p-2">ES type (orig)</th>}
                {visibleColumns.has("replication_es_type") && <th className="text-right p-2">ES type (rep)</th>}
                {visibleColumns.has("original_authors") && <th className="text-left p-2">Original authors</th>}
                {visibleColumns.has("replication_authors") && <th className="text-left p-2">Replication authors</th>}
                {visibleColumns.has("original_title") && <th className="text-left p-2">Original title</th>}
                {visibleColumns.has("replication_title") && <th className="text-left p-2">Replication title</th>}
                {visibleColumns.has("original_journal") && <th className="text-left p-2">Original journal</th>}
                {visibleColumns.has("replication_journal") && <th className="text-left p-2">Replication journal</th>}
                {visibleColumns.has("original_volume") && <th className="text-right p-2">Original volume</th>}
                {visibleColumns.has("replication_volume") && <th className="text-right p-2">Replication volume</th>}
                {visibleColumns.has("original_issue") && <th className="text-left p-2">Original issue</th>}
                {visibleColumns.has("replication_issue") && <th className="text-left p-2">Replication issue</th>}
                {visibleColumns.has("original_pages") && <th className="text-left p-2">Original pages</th>}
                {visibleColumns.has("replication_pages") && <th className="text-left p-2">Replication pages</th>}
                {visibleColumns.has("original_year") && <th className="text-right p-2">Original year</th>}
                {visibleColumns.has("replication_year") && <th className="text-right p-2">Replication year</th>}
                {visibleColumns.has("original_doi") && <th className="text-left p-2">Original DOI</th>}
                {visibleColumns.has("replication_doi") && <th className="text-left p-2">Replication DOI</th>}
                {visibleColumns.has("tags") && <th className="text-left p-2">Tags</th>}
                {visibleColumns.has("validated") && <th className="text-left p-2">Human Validated</th>}
                {visibleColumns.has("validated_person") && <th className="text-left p-2">Validated Person</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 2000).map((r, i) => {
                // Check if original data exists (not just empty strings)
                const origNVal = r.original_n ?? r.n_original;
                const repNVal = r.replication_n ?? r.n_replication;
                const origESVal = r.original_es_r ?? r.es_original;
                const repESVal = r.replication_es_r ?? r.es_replication;
                
                // Only convert to number if value exists and is not empty
                // Don't convert "0" strings if they represent missing data (empty in CSV = missing)
                const nO = origNVal != null && String(origNVal).trim() !== "" ? toNumber(origNVal) : null;
                const nR = repNVal != null && String(repNVal).trim() !== "" ? toNumber(repNVal) : null;
                const eO = origESVal != null && String(origESVal).trim() !== "" ? toNumber(origESVal) : null;
                const eR = repESVal != null && String(repESVal).trim() !== "" ? toNumber(repESVal) : null;
                
                const esOType = String(r.original_es_type ?? "");
                const esRType = String(r.replication_es_type ?? "");
                const citationO = String(r.original_citation_html || "");
                const citationR = String(r.replication_citation_html || "");
                return (
                  <tr key={i} className="border-b hover:bg-black/5 dark:hover:bg-white/5">
                    {visibleColumns.has("index") && (
                    <td className="align-top p-2 text-right">{i + 1}</td>
                    )}
                    {visibleColumns.has("original_citation_html") && (
                    <td className="align-top p-2" style={{ width: 240 }}>
                        {citationO ? (
                          <span dangerouslySetInnerHTML={{ __html: citationO }} />
                        ) : (
                          <span className="opacity-80">—</span>
                      )}
                    </td>
                    )}
                    {visibleColumns.has("replication_citation_html") && (
                    <td className="align-top p-2" style={{ width: 240 }}>
                        {citationR ? (
                          <span dangerouslySetInnerHTML={{ __html: citationR }} />
                        ) : (
                          <span className="opacity-80">—</span>
                      )}
                    </td>
                    )}
                    {visibleColumns.has("description") && (
                    <td className="align-top p-2">
                      <div className="font-medium">{String(r.description || r.tags || "—")}</div>
                    </td>
                    )}
                    {visibleColumns.has("discipline") && (
                    <td className="align-top p-2">{String(r.discipline || "")}</td>
                    )}
                    {visibleColumns.has("result") && (
                    <td className="align-top p-2">{String(r.result || "")}</td>
                    )}
                    {visibleColumns.has("original_n") && (
                      <td className="align-top p-2 text-right">{nO != null ? nO : ""}</td>
                    )}
                    {visibleColumns.has("replication_n") && (
                      <td className="align-top p-2 text-right">{nR != null ? nR : ""}</td>
                    )}
                    {visibleColumns.has("original_es_r") && (
                      <td className="align-top p-2 text-right">{eO != null ? `${formatSig4(eO)}${esOType ? ` ${esOType}` : ""}` : ""}</td>
                    )}
                    {visibleColumns.has("replication_es_r") && (
                      <td className="align-top p-2 text-right">{eR != null ? `${formatSig4(eR)}${esRType ? ` ${esRType}` : ""}` : ""}</td>
                    )}
                    {visibleColumns.has("original_es_r") && (
                      <td className="align-top p-2 text-right">{eO != null ? formatSig4(eO) : ""}</td>
                    )}
                    {visibleColumns.has("replication_es_r") && (
                      <td className="align-top p-2 text-right">{eR != null ? formatSig4(eR) : ""}</td>
                    )}
                    {visibleColumns.has("original_es_type") && (
                      <td className="align-top p-2 text-right">{esOType || ""}</td>
                    )}
                    {visibleColumns.has("replication_es_type") && (
                      <td className="align-top p-2 text-right">{esRType || ""}</td>
                    )}
                    {visibleColumns.has("original_authors") && (
                      <td className="align-top p-2">{String(r.original_authors || "")}</td>
                    )}
                    {visibleColumns.has("replication_authors") && (
                      <td className="align-top p-2">{String(r.replication_authors || "")}</td>
                    )}
                    {visibleColumns.has("original_title") && (
                      <td className="align-top p-2">{String(r.original_title || "")}</td>
                    )}
                    {visibleColumns.has("replication_title") && (
                      <td className="align-top p-2">{String(r.replication_title || "")}</td>
                    )}
                    {visibleColumns.has("original_journal") && (
                      <td className="align-top p-2">{String(r.original_journal || "")}</td>
                    )}
                    {visibleColumns.has("replication_journal") && (
                      <td className="align-top p-2">{String(r.replication_journal || "")}</td>
                    )}
                    {visibleColumns.has("original_volume") && (
                      <td className="align-top p-2 text-right">{String(r.original_volume || "")}</td>
                    )}
                    {visibleColumns.has("replication_volume") && (
                      <td className="align-top p-2 text-right">{String(r.replication_volume || "")}</td>
                    )}
                    {visibleColumns.has("original_issue") && (
                      <td className="align-top p-2">{String(r.original_issue || "")}</td>
                    )}
                    {visibleColumns.has("replication_issue") && (
                      <td className="align-top p-2">{String(r.replication_issue || "")}</td>
                    )}
                    {visibleColumns.has("original_pages") && (
                      <td className="align-top p-2">{String(r.original_pages || "")}</td>
                    )}
                    {visibleColumns.has("replication_pages") && (
                      <td className="align-top p-2">{String(r.replication_pages || "")}</td>
                    )}
                    {visibleColumns.has("original_year") && (
                      <td className="align-top p-2 text-right">{String(r.original_year || "")}</td>
                    )}
                    {visibleColumns.has("replication_year") && (
                      <td className="align-top p-2 text-right">{String(r.replication_year || "")}</td>
                    )}
                    {visibleColumns.has("original_doi") && (
                      <td className="align-top p-2">{String(r.original_doi || "")}</td>
                    )}
                    {visibleColumns.has("replication_doi") && (
                      <td className="align-top p-2">{String(r.replication_doi || "")}</td>
                    )}
                    {visibleColumns.has("tags") && (
                      <td className="align-top p-2">{String(r.tags || "")}</td>
                    )}
                    {visibleColumns.has("validated") && (
                      <td className="align-top p-2">{String(r.validated || "")}</td>
                    )}
                    {visibleColumns.has("validated_person") && (
                      <td className="align-top p-2">{String(r.validated_person || "")}</td>
                    )}
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.size} className="p-6 text-center opacity-70">No rows</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-2 text-xs opacity-60">Showing {Math.min(filteredRows.length, 2000)} of {filteredRows.length} rows.</div>
      </section>

      <section className="mx-auto max-w-[90%] mt-6 space-y-3">
        <p className="opacity-80">
          Data shown here are derived from the <a className="underline" href="https://forrt.org/apps/fred_explorer.html" target="_blank" rel="noreferrer">FReD replication dataset</a> as described in <a className="underline" href="https://openpsychologydata.metajnl.com/articles/10.5334/jopd.101" target="_blank" rel="noreferrer">Röseler et al., <em>Journal of Open Psychology Data</em>, 12: 8, pp. 1–23</a>.  Repository link: <a className="underline" href="https://osf.io/9r62x" target="_blank" rel="noreferrer">https://osf.io/9r62x</a> .
        </p>
        <p className="opacity-80">
          Data is © 2024 The Author(s) and licensed under <a className="underline" href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International (CC‑BY 4.0)</a>. You must credit the original authors and source if you use these data.
        </p>
      </section>
      </main>
      <Footer />
    </div>
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
      const o = toNumber(r.original_es_r ?? r.es_original);
      const rv = toNumber(r.replication_es_r ?? r.es_replication);
      if (o == null || rv == null) return null;
      const oAdj = o >= 0 ? o : -o;
      const rAdj = o >= 0 ? rv : -rv;
      const res = String(r.result || "").toLowerCase();
      return { o: oAdj, r: rAdj, desc: String(r.description || r.tags || ""), res };
    })
    .filter(Boolean) as Array<{ o: number; r: number; desc: string; res: string }>;

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
    if (res === "success") return "#10b981"; // Green for success
    if (res === "failure") return "#f87171"; // Red for failure
    return "#9ca3af"; // Gray for inconclusive or other
  }

  return (
    <div className="relative">
      <svg width={width} height={height} className="max-w-full">
        <g transform={`translate(${margin.left},${margin.top})`}>
          <rect x={0} y={0} width={innerW} height={innerH} fill="#f3f4f6" />
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
          {(() => {
            const tMin = Math.max(xMin, yMin);
            const tMax = Math.min(xMax, yMax);
            return (
              <line x1={x(tMin)} y1={y(tMin)} x2={x(tMax)} y2={y(tMax)} stroke="#6b7280" strokeDasharray="4 4" />
            );
          })()}
          {pts.map((p, i) => {
            const fill = color(p.res);
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


