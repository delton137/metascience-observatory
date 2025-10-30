import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { csvParse } from "d3-dsv";

export const runtime = "nodejs";

type AnyRecord = Record<string, unknown>;

type Aggregates = {
  yearMin: number | null;
  yearMax: number | null;
  total: number;
  filteredTotal: number;
  years: number[];
  journals: Array<{ name: string; count: number }>;
  reasons: Array<{ name: string; count: number }>;
  timeline: Array<{ year: number; count: number }>;
};

let cachedRows: AnyRecord[] | null = null;
let cachedColumns: string[] | null = null;

async function loadCsv(filePath: string): Promise<{ rows: AnyRecord[]; columns: string[] }> {
  const csvText = await fs.readFile(filePath, "utf8");
  const rows = csvParse(csvText);
  const columns = rows.columns ?? [];
  const normalized = rows.map((row: AnyRecord) => {
    const obj: AnyRecord = {};
    for (const key of columns) {
      obj[key] = row[key as keyof typeof row] ?? null;
    }
    return obj;
  });
  return { rows: normalized, columns };
}

function parseYearFromDate(value: unknown): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const yearMatch = s.match(/(\d{4})/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    if (Number.isFinite(year)) return year;
  }
  const d = new Date(s);
  const y = d.getFullYear();
  return Number.isFinite(y) ? y : null;
}

function splitMulti(value: unknown): string[] {
  const s = String(value ?? "").trim();
  if (!s) return [];
  return s
    .split(";")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function aggregate(
  rows: AnyRecord[],
  opts: { startYear?: number; endYear?: number; nature?: string | null; top?: number }
): Aggregates {
  const startYear = opts.startYear ?? -Infinity;
  const endYear = opts.endYear ?? Infinity;
  const natureFilter = (opts.nature || "").trim().toLowerCase();
  const top = Math.max(1, Math.min(1000, opts.top ?? 20));

  const yearsAll = new Set<number>();
  for (const r of rows) {
    const y = parseYearFromDate(r.RetractionDate);
    if (y != null) yearsAll.add(y);
  }
  const years = Array.from(yearsAll).sort((a, b) => a - b);
  const yearMin = years.length ? years[0] : null;
  const yearMax = years.length ? years[years.length - 1] : null;

  const filtered = rows.filter((r) => {
    const y = parseYearFromDate(r.RetractionDate);
    if (y == null || y < startYear || y > endYear) return false;
    if (natureFilter) {
      const n = String(r.RetractionNature ?? "").trim().toLowerCase();
      if (n !== natureFilter) return false;
    }
    return true;
  });

  const byJournal = new Map<string, number>();
  const byReason = new Map<string, number>();
  const byYear = new Map<number, number>();

  for (const r of filtered) {
    const journal = String(r.Journal ?? "Unknown").trim() || "Unknown";
    byJournal.set(journal, (byJournal.get(journal) ?? 0) + 1);

    const reasons = splitMulti(r.Reason);
    if (reasons.length === 0) byReason.set("Unspecified", (byReason.get("Unspecified") ?? 0) + 1);
    for (const reason of reasons) {
      byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
    }

    const y = parseYearFromDate(r.RetractionDate);
    if (y != null) byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }

  const journals = Array.from(byJournal.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);

  const reasons = Array.from(byReason.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(top, 25));

  const timeline = Array.from(byYear.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  return {
    yearMin,
    yearMax,
    total: rows.length,
    filteredTotal: filtered.length,
    years,
    journals,
    reasons,
    timeline,
  };
}

export async function GET(request: Request) {
  try {
    if (!cachedRows || !cachedColumns) {
      const dataPath = path.join(
        process.cwd(),
        "data",
        "retraction-watch-data",
        "retraction_watch.csv"
      );
      const loaded = await loadCsv(dataPath);
      cachedRows = loaded.rows;
      cachedColumns = loaded.columns;
    }

    const { searchParams } = new URL(request.url);
    const startYear = Number(searchParams.get("startYear"));
    const endYear = Number(searchParams.get("endYear"));
    const nature = searchParams.get("nature");
    const top = Number(searchParams.get("top"));

    const result = aggregate(cachedRows!, {
      startYear: Number.isFinite(startYear) ? startYear : undefined,
      endYear: Number.isFinite(endYear) ? endYear : undefined,
      nature,
      top: Number.isFinite(top) ? top : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


