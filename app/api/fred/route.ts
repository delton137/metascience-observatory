import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { csvParse } from "d3-dsv";

export const runtime = "nodejs";

type AnyRecord = Record<string, unknown>;

let cachedData: { rows: AnyRecord[]; columns: string[]; lastUpdated?: string } | null = null;

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeEffectSigns(row: AnyRecord): void {
  const eO = toNumber(row.original_es_r);
  const eR = toNumber(row.replication_es_r);
  if (eO == null || eR == null) return;
  if (eO < 0) {
    row.original_es_r = -eO;
    row.replication_es_r = -eR;
    row.es_original = -eO;
    row.es_replication = -eR;
  } else {
    row.original_es_r = eO;
    row.replication_es_r = eR;
    row.es_original = eO;
    row.es_replication = eR;
  }
}


/**
 * Rows that are SAME-DATA RE-ANALYSES rather than NEW-DATA REPLICATIONS.
 *
 * These answer different questions. A re-analysis asks "did they compute it
 * correctly?"; a replication asks "is the effect real?" Brodeur et al. (2026,
 * Nature 652:151-156) find the median re-analysis effect is 99% the size of
 * the published one, because it is largely the same arithmetic on the same
 * numbers. Pooling the two inflates every replication rate on the site and
 * understates every measure of effect-size shrinkage.
 *
 * The database has no field for this. `replication_type` describes how closely
 * the PROTOCOL matched (direct / close / conceptual / ...) and no value of it
 * encodes whether new data were collected -- and the re-analyses are filed
 * under "close experiment", which reads as the opposite of what they are.
 *
 * Until a proper `evidence_type` column exists, the DARPA SCORE block is
 * excluded here: per Tyner et al. (2026, Nature 652:143-150) its political
 * science arm is 25 of 28 secondary-data re-analyses and sociology 14 of 15.
 * Those three fields are 84-91% SCORE in this database, so their published
 * rates are effectively that programme's rates wearing a field's name.
 *
 * This is a BLUNT instrument and it is meant to be temporary: it drops the
 * genuine new-data replications inside SCORE along with the re-analyses.
 * Replace it with a per-row `evidence_type` as soon as one exists, and delete
 * this function.
 */
const EXCLUDE_SECONDARY_REANALYSES =
  process.env.MO_INCLUDE_REANALYSES !== "1";

function isSecondaryDataReanalysis(row: AnyRecord): boolean {
  const src = String(row.source ?? "");
  return /DARPA\s*SCORE|Tyner/i.test(src);
}

async function loadCsv(filePath: string): Promise<{ rows: AnyRecord[]; columns: string[] }> {
  const csvText = await fs.readFile(filePath, "utf8");
  const rows = csvParse(csvText);
  const columns = rows.columns ?? [];
  const normalized = rows.map((row: AnyRecord) => {
    const obj: AnyRecord = {};
    for (const key of columns) {
      obj[key] = row[key as keyof typeof row] ?? null;
    }
    // Map new column names to old ones for compatibility
    obj.es_original = obj.original_es_r ?? null;
    obj.es_replication = obj.replication_es_r ?? null;
    obj.n_original = obj.original_n ?? null;
    obj.n_replication = obj.replication_n ?? null;
    // Keep original citation HTML columns
    // Strip heavy text columns not needed by frontend pages
    delete obj.explanation;
    return obj;
  });
  const filtered = normalized.filter((r: AnyRecord) => {
    if (EXCLUDE_SECONDARY_REANALYSES && isSecondaryDataReanalysis(r)) return false;
    const eO = Number(String(r.original_es_r ?? "").trim());
    const eR = Number(String(r.replication_es_r ?? "").trim());
    return Number.isFinite(eO) && Number.isFinite(eR);
  });
  for (const r of filtered) normalizeEffectSigns(r);
  return { rows: filtered, columns };
}

async function getLatestFilename(): Promise<string> {
  const versionHistoryPath = path.join(process.cwd(), "data", "version_history.txt");
  const versionHistoryText = await fs.readFile(versionHistoryPath, "utf8");
  const lines = versionHistoryText.trim().split("\n").filter(line => line.trim() && !line.trim().startsWith('#'));
  const lastLine = lines[lines.length - 1];
  // Strip any inline comments
  const filename = lastLine.split('#')[0].trim();
  return filename;
}

function extractDateFromFilename(filename: string): string | null {
  // Filename format: replications_database_YYYY_MM_DD_HHMMSS.csv
  // Extract date part: YYYY_MM_DD
  const match = filename.match(/replications_database_(\d{4})_(\d{2})_(\d{2})_\d+\.csv/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }
  return null;
}

export async function GET() {
  try {
    if (!cachedData) {
      const filename = await getLatestFilename();
      const dataPath = path.join(process.cwd(), "data", filename);
      const csvData = await loadCsv(dataPath);
      const lastUpdated = extractDateFromFilename(filename);
      cachedData = { ...csvData, lastUpdated: lastUpdated || undefined };
    }

    return NextResponse.json({
      columns: cachedData.columns,
      rows: cachedData.rows,
      lastUpdated: cachedData.lastUpdated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


