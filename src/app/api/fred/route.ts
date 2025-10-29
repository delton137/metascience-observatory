import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { csvParse } from "d3-dsv";

export const runtime = "nodejs";

type AnyRecord = Record<string, unknown>;

let cachedData: { rows: AnyRecord[]; columns: string[] } | null = null;

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
  // Normalize effect signs (original positive)
  for (const r of filtered) normalizeEffectSigns(r);
  return { rows: filtered, columns };
}

export async function GET() {
  try {
    if (!cachedData) {
      const dataPath = path.join(process.cwd(), "data", "fred_data.csv");
      cachedData = await loadCsv(dataPath);
    }

    return NextResponse.json({
      columns: cachedData.columns,
      rows: cachedData.rows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


