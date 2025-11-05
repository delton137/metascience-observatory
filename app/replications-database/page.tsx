"use client";

import { useEffect, useMemo, useState } from "react";
import { ReplicationsNavbar } from "@/components/ReplicationsNavbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";

type AnyRecord = Record<string, unknown>;

type FredResponse = {
  columns: string[];
  rows: AnyRecord[];
  lastUpdated?: string;
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

function MiniBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const widthPct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2 bg-black/10 dark:bg-white/10 rounded">
      <div 
        className={`h-2 rounded ${color ? "" : "bg-black/60 dark:bg-white/60"}`}
        style={{ 
          width: `${widthPct}%`,
          ...(color ? { backgroundColor: color } : {})
        }} 
      />
    </div>
  );
}

// Compute p-value from t-statistic (approximate two-tailed)
function pValueFromT(t: number, df: number): number {
  // Simplified approximation - for more precision, use proper t-distribution
  // Using normal approximation for df > 30
  const z = Math.abs(t);
  if (df > 30) {
    // Quick approximation: p ≈ 2 * (1 - normcdf(z))
    // Using erf approximation for standard normal
    if (z > 6) return 0;
    const x = z / Math.SQRT2;
    const erf = 1 - 1 / (1 + 0.278393 * x + 0.230389 * x * x + 0.000972 * x * x * x + 0.078108 * x * x * x * x) ** 4;
    // Two-tailed: multiply by 2
    return 2 * (1 - erf);
  }
  // For smaller df, use a rough approximation (two-tailed)
  if (z > 3) return 0.01;
  if (z > 2.5) return 0.02;
  if (z > 2) return 0.05;
  if (z > 1.96) return 0.06;
  if (z > 1.5) return 0.15;
  return 0.5;
}

// Compute outcome using "Repeated significance of effect direction" method
function computeSignificanceOutcome(
  origES: number,
  repES: number,
  origN: number,
  repN: number,
  origESType: string,
  repESType: string
): "success" | "failure" | "inconclusive" {
  // Check if same direction
  const sameDirection = (origES > 0 && repES > 0) || (origES < 0 && repES < 0);
  const oppositeDirection = (origES > 0 && repES < 0) || (origES < 0 && repES > 0);
  
  // If opposite direction and replication has meaningful effect, it's a failure
  if (oppositeDirection && Math.abs(repES) > 0.01) {
    return "failure";
  }

  // If replication effect is essentially zero, check if original was also near zero
  if (Math.abs(repES) < 0.001) {
    if (Math.abs(origES) < 0.001) {
      return "inconclusive"; // Both near zero
    }
    return "failure"; // Original had effect, replication doesn't
  }

  // Compute significance for replication
  let tRep: number | null = null;
  let dfRep: number | null = null;

  const repType = (repESType || "").toLowerCase();
  
  if (repType === "r" || repType === "") {
    // Correlation: t = r * sqrt((n-2)/(1-r^2))
    if (Math.abs(repES) < 0.999 && repN > 2) {
      const denom = 1 - repES * repES;
      if (denom > 0.001) {
        tRep = repES * Math.sqrt((repN - 2) / denom);
        dfRep = repN - 2;
      }
    }
  } else if (repType === "d") {
    // Cohen's d: simplified t = d * sqrt(n/2) for equal groups
    // Using simplified approximation assuming two groups
    if (repN > 2) {
      tRep = repES * Math.sqrt(repN / 2);
      dfRep = repN - 2;
    }
  } else if (repType === "etasq" || repType === "eta squared") {
    // Eta squared - convert to correlation-like metric first
    if (repES > 0 && repES < 1 && repN > 2) {
      const r = Math.sqrt(repES);
      const denom = 1 - r * r;
      if (denom > 0.001) {
        tRep = r * Math.sqrt((repN - 2) / denom);
        dfRep = repN - 2;
      }
    }
  } else {
    // Unknown type, try correlation approach
    if (Math.abs(repES) < 0.999 && repN > 2) {
      const denom = 1 - repES * repES;
      if (denom > 0.001) {
        tRep = repES * Math.sqrt((repN - 2) / denom);
        dfRep = repN - 2;
      }
    }
  }

  if (tRep == null || dfRep == null || dfRep <= 0) {
    return "inconclusive";
  }

  const pRep = pValueFromT(tRep, dfRep);
  const isSignificant = pRep < 0.05;

  if (sameDirection && isSignificant) {
    return "success";
  } else if (sameDirection && !isSignificant) {
    return "inconclusive"; // Same direction but not significant
  } else {
    return "failure"; // Should not reach here due to earlier checks, but just in case
  }
}

// Compute outcome using "Replication Confidence Interval Consistency" method
function computeConfidenceIntervalOutcome(
  origES: number,
  repES: number,
  origN: number,
  repN: number,
  origESType: string,
  repESType: string
): "success" | "failure" | "inconclusive" {
  // Validate inputs
  if (!Number.isFinite(origES) || !Number.isFinite(repES) || !Number.isFinite(origN) || !Number.isFinite(repN)) {
    return "inconclusive";
  }
  
  // Compute standard error for replication effect size
  let seRep: number | null = null;

  const repType = (repESType || "").toLowerCase();
  
  if (repType === "r" || repType === "") {
    // Correlation: Use Fisher z-transform for more accurate CI
    // SE_z = 1/sqrt(n-3)
    if (repN > 3 && Math.abs(repES) < 0.999) {
      try {
        const zRep = 0.5 * Math.log((1 + repES) / (1 - repES));
        const seZ = 1 / Math.sqrt(repN - 3);
        // Convert back to SE of r: SE_r ≈ (1-r^2) * SE_z
        const rSquared = repES * repES;
        seRep = (1 - rSquared) * seZ;
        // Ensure positive and reasonable
        if (seRep <= 0 || !Number.isFinite(seRep)) seRep = null;
      } catch (e) {
        // Handle edge cases (e.g., repES = 1 or -1)
        seRep = null;
      }
    }
    // Fallback: simpler approximation if Fisher transform fails
    if (seRep == null && repN > 2 && Math.abs(repES) < 0.999) {
      const rSquared = repES * repES;
      seRep = Math.sqrt((1 - rSquared) * (1 - rSquared) / (repN - 1));
    }
  } else if (repType === "d") {
    // Cohen's d: SE ≈ sqrt((n1+n2)/(n1*n2) + d^2/(2*(n1+n2)))
    // Simplified for equal groups (assuming n1 = n2 = n/2): SE ≈ sqrt(4/n + d^2/n)
    // Even simpler approximation: SE ≈ sqrt(2/n) for equal groups (ignoring d term for simplicity)
    if (repN > 2) {
      seRep = Math.sqrt(2 / repN);
    }
  } else if (repType === "etasq" || repType === "eta squared") {
    // For eta squared, convert to correlation-like metric
    if (repES > 0 && repES < 1 && repN > 3) {
      try {
        const r = Math.sqrt(repES);
        if (Math.abs(r) < 0.999) {
          const z = 0.5 * Math.log((1 + r) / (1 - r));
          const seZ = 1 / Math.sqrt(repN - 3);
          const rSquared = r * r;
          seRep = (1 - rSquared) * seZ;
          if (seRep <= 0 || !Number.isFinite(seRep)) seRep = null;
        }
      } catch (e) {
        seRep = null;
      }
    }
  } else {
    // Default: try correlation approach
    if (repN > 3 && Math.abs(repES) < 0.999) {
      try {
        const zRep = 0.5 * Math.log((1 + repES) / (1 - repES));
        const seZ = 1 / Math.sqrt(repN - 3);
        const rSquared = repES * repES;
        seRep = (1 - rSquared) * seZ;
        if (seRep <= 0 || !Number.isFinite(seRep)) seRep = null;
      } catch (e) {
        seRep = null;
      }
    }
  }

  if (seRep == null || seRep <= 0 || !Number.isFinite(seRep)) {
    return "inconclusive";
  }

  // Compute 95% confidence interval
  const z95 = 1.96;
  const ciLower = repES - z95 * seRep;
  const ciUpper = repES + z95 * seRep;

  // Validate CI bounds
  if (!Number.isFinite(ciLower) || !Number.isFinite(ciUpper) || ciLower > ciUpper) {
    return "inconclusive";
  }

  // Check if original effect size falls within replication CI
  if (origES >= ciLower && origES <= ciUpper) {
    return "success";
  } else {
    return "failure";
  }
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
  | "original_url"
  | "replication_url"
  | "tags"
  | "validated"
  | "validated_person";

const ALL_COLUMNS: Array<{ key: ColumnKey; label: string }> = [
  { key: "index", label: "#" },
  { key: "original_citation_html", label: "Original publication" },
  { key: "replication_citation_html", label: "Replication publication" },
  { key: "description", label: "Description of the original effect" },
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
  { key: "original_url", label: "Original URL" },
  { key: "replication_url", label: "Replication URL" },
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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [discipline, setDiscipline] = useState<string>("");
  const [openAlexField, setOpenAlexField] = useState<string>("");
  const [openAlexSubfield, setOpenAlexSubfield] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(DEFAULT_COLUMNS)
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [outcomeMethod, setOutcomeMethod] = useState<"significance" | "confidence">("significance");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/fred", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FredResponse;
        setData(json);
        setLastUpdated(json.lastUpdated || null);
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

  const openAlexFieldOptions: Option[] = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const r of data.rows) {
      const key = String(r.openalex_field ?? "");
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
      if (v === "") return { value: v, label: "All fields" };
      const c = counts.get(v) || 0;
      return { value: v, label: `${v} (${c})` };
    });
  }, [data]);

  const openAlexSubfieldOptions: Option[] = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const r of data.rows) {
      const key = String(r.openalex_subfield ?? "");
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
      if (v === "") return { value: v, label: "All subfields" };
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
      if (openAlexField && String(r.openalex_field ?? "") !== openAlexField) return false;
      if (openAlexSubfield && String(r.openalex_subfield ?? "") !== openAlexSubfield) return false;
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
  }, [data, discipline, openAlexField, openAlexSubfield, result, search]);

  // Stat for outcome mix - only includes rows with effect sizes
  const outcomeStat = useMemo(() => {
    let n = 0;
    let success = 0;
    let failure = 0;
    let inconclusive = 0;
    let withEffectSizes = 0;
    for (const r of filteredRows) {
      // Compute outcome using effect sizes
      const eO = toNumber(r.original_es_r ?? r.es_original);
      const eR = toNumber(r.replication_es_r ?? r.es_replication);
      const nO = toNumber(r.original_n ?? r.n_original);
      const nR = toNumber(r.replication_n ?? r.n_replication);
      const esOType = String(r.original_es_type ?? "");
      const esRType = String(r.replication_es_type ?? "");
      
      // Only include if effect sizes are available
      if (eO == null || eR == null || nO == null || nR == null || nO <= 0 || nR <= 0) {
        continue; // Skip rows without effect sizes
      }
      
      n++; // Count this row
      
      let res: "success" | "failure" | "inconclusive";
      if (outcomeMethod === "significance") {
        res = computeSignificanceOutcome(eO, eR, nO, nR, esOType, esRType);
      } else { // confidence
        res = computeConfidenceIntervalOutcome(eO, eR, nO, nR, esOType, esRType);
      }
      
      if (res === "success") success++;
      else if (res === "failure") failure++;
      else inconclusive++;
      
      // Count rows with both original and replication effect sizes present
      if (eO != null && eR != null && eO !== 0 && eR !== 0) {
        withEffectSizes++;
      }
    }
    const pct = (v: number) => (n > 0 ? Math.round((v / n) * 1000) / 10 : 0);
    return { n, success, failure, inconclusive, pctSuccess: pct(success), pctFailure: pct(failure), pctInconclusive: pct(inconclusive), withEffectSizes };
  }, [filteredRows, outcomeMethod]);

  // Stat for result column-based display
  const resultStat = useMemo(() => {
    const n = filteredRows.length;
    let success = 0;
    let failure = 0;
    let inconclusive = 0;
    
    for (const r of filteredRows) {
      const result = String(r.result ?? "").trim();
      // Check exact matches (case-sensitive based on data)
      if (result === "success") {
        success++;
      } else if (result === "failure") {
        failure++;
      } else if (result === "inconclusive" || result === "") {
        // Empty result counts as inconclusive
        inconclusive++;
      } else {
        // Any other non-empty value counts as inconclusive
        inconclusive++;
      }
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
        <div className="grid gap-3 md:grid-cols-5 items-end">
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
          <div className="md:col-span-1">
            <label htmlFor="openAlexField" className="block text-sm font-medium opacity-80 mb-1">OpenAlex Field (experimental - has errors)</label>
            <select
              id="openAlexField"
              value={openAlexField}
              onChange={(e) => setOpenAlexField(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {openAlexFieldOptions.map((opt) => (
                <option key={opt.value || "__all"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label htmlFor="openAlexSubfield" className="block text-sm font-medium opacity-80 mb-1">OpenAlex Subfield</label>
            <select
              id="openAlexSubfield"
              value={openAlexSubfield}
              onChange={(e) => setOpenAlexSubfield(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {openAlexSubfieldOptions.map((opt) => (
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
          <div className="text-sm opacity-70">Effect replications</div>
          <div className="text-3xl font-semibold">{resultStat.n}</div>
          <div className="text-sm opacity-70 mt-2">Outcome mix (human judgement)</div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm">Success</div>
              <div className="flex-1"><MiniBar value={resultStat.pctSuccess} max={100} color="#10b981" /></div>
              <div className="w-24 text-right text-sm">{resultStat.success} ({resultStat.pctSuccess}%)</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm">Inconclusive</div>
              <div className="flex-1"><MiniBar value={resultStat.pctInconclusive} max={100} color="#9ca3af" /></div>
              <div className="w-24 text-right text-sm">{resultStat.inconclusive} ({resultStat.pctInconclusive}%)</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm">Failure</div>
              <div className="flex-1"><MiniBar value={resultStat.pctFailure} max={100} color="#f87171" /></div>
              <div className="w-24 text-right text-sm">{resultStat.failure} ({resultStat.pctFailure}%)</div>
            </div>
          </div>
        </div>
        <div className="border rounded p-4 col-span-1">
          <div className="text-sm opacity-70 mb-2">Outcome mix - computed from effect sizes when available ({outcomeStat.n} replications)</div>
          <div className="mb-3">
            <label className="block text-sm font-medium opacity-80 mb-1">
              Method{" "}
              <a
                href="https://forrt.org/FReD/articles/success_criteria.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs opacity-60 hover:opacity-80 underline"
              >
                more info
              </a>
            </label>
            <select
              value={outcomeMethod}
              onChange={(e) => setOutcomeMethod(e.target.value as "significance" | "confidence")}
              className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-1 focus:ring-primary"
              title={
                outcomeMethod === "significance"
                  ? "Check if replication has statistically significant result in same direction as original"
                  : "Check if original effect size falls within replication confidence interval"
              }
            >
              <option value="significance">Repeated significance of effect direction</option>
              <option value="confidence">Replication Confidence Interval Consistency</option>
            </select>
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm">Success</div>
              <div className="flex-1"><MiniBar value={outcomeStat.pctSuccess} max={100} color="#10b981" /></div>
              <div className="w-24 text-right text-sm">{outcomeStat.success} ({outcomeStat.pctSuccess}%)</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm">Inconclusive</div>
              <div className="flex-1"><MiniBar value={outcomeStat.pctInconclusive} max={100} color="#9ca3af" /></div>
              <div className="w-24 text-right text-sm">{outcomeStat.inconclusive} ({outcomeStat.pctInconclusive}%)</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm">Failure</div>
              <div className="flex-1"><MiniBar value={outcomeStat.pctFailure} max={100} color="#f87171" /></div>
              <div className="w-24 text-right text-sm">{outcomeStat.failure} ({outcomeStat.pctFailure}%)</div>
            </div>
          </div>
        </div>
        <div className="border rounded p-4 col-span-2">
          <div className="text-sm opacity-70">Replication Effect Size vs Original Effect Size ({outcomeStat.withEffectSizes} replications)</div>
          <div className="mt-2">
            <InlineScatter rows={filteredRows} outcomeMethod={outcomeMethod} />
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
                {visibleColumns.has("description") && <th className="text-left p-2">Description of the original effect</th>}
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
                {visibleColumns.has("original_url") && <th className="text-left p-2">Original URL</th>}
                {visibleColumns.has("replication_url") && <th className="text-left p-2">Replication URL</th>}
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
                      <td className="align-top p-2 text-right">{nO != null && nO !== 0 ? nO : ""}</td>
                    )}
                    {visibleColumns.has("replication_n") && (
                      <td className="align-top p-2 text-right">{nR != null && nR !== 0 ? nR : ""}</td>
                    )}
                    {visibleColumns.has("original_es_r") && (
                      <td className="align-top p-2 text-right">{eO != null && eO !== 0 ? `${formatSig4(eO)}${esOType ? ` ${esOType}` : ""}` : ""}</td>
                    )}
                    {visibleColumns.has("replication_es_r") && (
                      <td className="align-top p-2 text-right">{eR != null && eR !== 0 ? `${formatSig4(eR)}${esRType ? ` ${esRType}` : ""}` : ""}</td>
                    )}
                    {visibleColumns.has("original_es_r") && (
                      <td className="align-top p-2 text-right">{eO != null && eO !== 0 ? formatSig4(eO) : ""}</td>
                    )}
                    {visibleColumns.has("replication_es_r") && (
                      <td className="align-top p-2 text-right">{eR != null && eR !== 0 ? formatSig4(eR) : ""}</td>
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
                    {visibleColumns.has("original_url") && (
                      <td className="align-top p-2">{String(r.original_url || "")}</td>
                    )}
                    {visibleColumns.has("replication_url") && (
                      <td className="align-top p-2">{String(r.replication_url || "")}</td>
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
        <div className="p-2 flex justify-between items-center">
          <div className="text-xs opacity-60">Showing {Math.min(filteredRows.length, 2000)} of {filteredRows.length} rows.</div>
          {lastUpdated && (
            <div className="text-xs opacity-60">Last updated {lastUpdated}</div>
          )}
        </div>
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

function InlineScatter({ rows, outcomeMethod }: { rows: AnyRecord[]; outcomeMethod: "significance" | "confidence" }) {
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
      
      // Compute outcome using the selected method
      const nO = toNumber(r.original_n ?? r.n_original);
      const nR = toNumber(r.replication_n ?? r.n_replication);
      const esOType = String(r.original_es_type ?? "");
      const esRType = String(r.replication_es_type ?? "");
      
      let res: "success" | "failure" | "inconclusive";
      if (nO == null || nR == null || nO <= 0 || nR <= 0) {
        res = "inconclusive";
      } else if (outcomeMethod === "significance") {
        res = computeSignificanceOutcome(o, rv, nO, nR, esOType, esRType);
      } else { // confidence
        res = computeConfidenceIntervalOutcome(o, rv, nO, nR, esOType, esRType);
      }
      
      return { o: oAdj, r: rAdj, desc: String(r.description || r.tags || ""), res };
    })
    .filter(Boolean) as Array<{ o: number; r: number; desc: string; res: "success" | "failure" | "inconclusive" }>;

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

  function color(res: "success" | "failure" | "inconclusive"): string {
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
          <span className="inline-block w-3 h-3 rounded" style={{ background: "#9ca3af" }} />
          <span>Inconclusive</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded" style={{ background: "#f87171" }} />
          <span>Failure</span>
        </div>
      </div>
    </div>
  );
}


