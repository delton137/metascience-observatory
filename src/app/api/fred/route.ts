import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { csvParse } from "d3-dsv";

export const runtime = "nodejs";

type AnyRecord = Record<string, unknown>;

let cachedData: { rows: AnyRecord[]; columns: string[] } | null = null;
let cachedDict: Record<string, string> | null = null;

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeEffectSigns(row: AnyRecord): void {
  const eO = toNumber(row.es_original);
  const eR = toNumber(row.es_replication);
  if (eO == null || eR == null) return;
  if (eO < 0) {
    row.es_original = -eO;
    row.es_replication = -eR;
  } else {
    row.es_original = eO;
    row.es_replication = eR;
  }
}

function dedupeRows(rows: AnyRecord[]): AnyRecord[] {
  const byKey = new Map<string, AnyRecord>();
  for (const r of rows) {
    const osf = String(r.osf_link ?? "").trim().toLowerCase();
    const desc = String(r.description ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    const key = `${osf}|${desc}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, r);
      continue;
    }
    // Prefer row with larger replication N; fallback to larger original N
    const nRepNew = toNumber(r.n_replication) ?? -1;
    const nRepOld = toNumber(existing.n_replication) ?? -1;
    if (nRepNew > nRepOld) {
      byKey.set(key, r);
      continue;
    }
    if (nRepNew === nRepOld) {
      const nONew = toNumber(r.n_original) ?? -1;
      const nOld = toNumber(existing.n_original) ?? -1;
      if (nONew > nOld) byKey.set(key, r);
    }
  }
  return Array.from(byKey.values());
}

async function loadCsv(filePath: string): Promise<{ rows: AnyRecord[]; columns: string[] }> {
  const csvText = await fs.readFile(filePath, "utf8");
  const rows = csvParse(csvText);
  const columns = rows.columns ?? [];
  // Convert to plain objects
  const normalized = rows.map((row: AnyRecord) => {
    const obj: AnyRecord = {};
    for (const key of columns) {
      obj[key] = row[key as keyof typeof row] ?? null;
    }
    return obj;
  });
  // Pre-filter: require numeric es_original and es_replication
  const filtered = normalized.filter((r: AnyRecord) => {
    const eO = Number(String(r.es_original ?? "").trim());
    const eR = Number(String(r.es_replication ?? "").trim());
    return Number.isFinite(eO) && Number.isFinite(eR);
  });
  // Normalize effect signs (original positive) and deduplicate
  for (const r of filtered) normalizeEffectSigns(r);
  const deduped = dedupeRows(filtered);
  return { rows: deduped, columns };
}

async function loadDictionary(filePath: string): Promise<Record<string, string>> {
  const csvText = await fs.readFile(filePath, "utf8");
  const rows = csvParse(csvText) as unknown as Array<{ Variable?: string; Description?: string }>;
  const dict: Record<string, string> = {};
  for (const r of rows) {
    const key = (r.Variable || "").trim();
    if (!key) continue;
    const value = (r.Description || "").trim();
    dict[key] = value;
  }
  return dict;
}

export async function GET() {
  try {
    if (!cachedData) {
      const dataPath = path.join(process.cwd(), "data", "fred_data.csv");
      cachedData = await loadCsv(dataPath);
    }
    if (!cachedDict) {
      const dictPath = path.join(process.cwd(), "data", "fred_data_dictionary.csv");
      cachedDict = await loadDictionary(dictPath);
    }

    return NextResponse.json({
      columns: cachedData.columns,
      rows: cachedData.rows,
      dictionary: cachedDict,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


