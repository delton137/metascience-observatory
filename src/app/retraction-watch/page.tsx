"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type JournalDatum = { name: string; count: number };
type ReasonDatum = { name: string; count: number };
type TimelineDatum = { year: number; count: number };

type ApiResponse = {
  yearMin: number | null;
  yearMax: number | null;
  total: number;
  filteredTotal: number;
  years: number[];
  journals: JournalDatum[];
  reasons: ReasonDatum[];
  timeline: TimelineDatum[];
};

function numberFormatter(n: number): string {
  return new Intl.NumberFormat().format(n);
}

function fillTimelineGaps(data: TimelineDatum[], startYear: number, endYear: number): TimelineDatum[] {
  const byYear = new Map<number, number>();
  for (const d of data) byYear.set(d.year, d.count);
  const filled: TimelineDatum[] = [];
  for (let y = startYear; y <= endYear; y++) {
    filled.push({ year: y, count: byYear.get(y) ?? 0 });
  }
  return filled;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function DualRangeSlider({
  min,
  max,
  start,
  end,
  onChange,
}: {
  min: number;
  max: number;
  start: number;
  end: number;
  onChange: (range: { start: number; end: number }) => void;
}) {
  const [active, setActive] = useState<"start" | "end" | null>(null);
  const [trackEl, setTrackEl] = useState<HTMLDivElement | null>(null);

  function valueToPercent(v: number): number {
    if (max === min) return 0;
    return ((v - min) / (max - min)) * 100;
  }

  const clientXToValue = useCallback(
    (clientX: number): number => {
      if (!trackEl) return start;
      const rect = trackEl.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const val = Math.round(min + ratio * (max - min));
      return clamp(val, min, max);
    },
    [trackEl, start, min, max]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!active) return;
      const raw = clientXToValue(e.clientX);
      if (active === "start") {
        const nextStart = Math.min(raw, end);
        onChange({ start: nextStart, end });
      } else if (active === "end") {
        const nextEnd = Math.max(raw, start);
        onChange({ start, end: nextEnd });
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!active) return;
      const t = e.touches[0];
      if (!t) return;
      const raw = clientXToValue(t.clientX);
      if (active === "start") {
        const nextStart = Math.min(raw, end);
        onChange({ start: nextStart, end });
      } else if (active === "end") {
        const nextEnd = Math.max(raw, start);
        onChange({ start, end: nextEnd });
      }
    };
    const onUp = () => setActive(null);
    if (active) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchend", onUp);
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchend", onUp);
      };
    }
  }, [active, start, end, min, max, clientXToValue, onChange]);

  const startPercent = valueToPercent(start);
  const endPercent = valueToPercent(end);
  const left = Math.min(startPercent, endPercent);
  const width = Math.abs(endPercent - startPercent);

  return (
    <div className="w-full select-none">
      <div
        ref={setTrackEl}
        className="relative h-2 rounded bg-gray-200"
        onMouseDown={(e) => {
          if (!trackEl) return;
          const val = clientXToValue(e.clientX);
          const distStart = Math.abs(val - start);
          const distEnd = Math.abs(val - end);
          if (distStart <= distEnd) {
            onChange({ start: Math.min(val, end), end });
            setActive("start");
          } else {
            onChange({ start, end: Math.max(val, start) });
            setActive("end");
          }
        }}
        onTouchStart={(e) => {
          if (!trackEl) return;
          const t = e.touches[0];
          const val = clientXToValue(t.clientX);
          const distStart = Math.abs(val - start);
          const distEnd = Math.abs(val - end);
          if (distStart <= distEnd) {
            onChange({ start: Math.min(val, end), end });
            setActive("start");
          } else {
            onChange({ start, end: Math.max(val, start) });
            setActive("end");
          }
        }}
      >
        <div
          className="absolute top-0 h-2 rounded bg-blue-300/60"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        {/* start thumb */}
        <div
          role="slider"
          aria-label="Start year"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={start}
          tabIndex={0}
          className="absolute -top-1 h-4 w-4 rounded-full bg-white border border-gray-400 shadow cursor-grab"
          style={{ left: `${startPercent}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActive("start");
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setActive("start");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange({ start: clamp(start - 1, min, end), end });
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange({ start: clamp(start + 1, min, end), end });
          }}
        />
        {/* end thumb */}
        <div
          role="slider"
          aria-label="End year"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={end}
          tabIndex={0}
          className="absolute -top-1 h-4 w-4 rounded-full bg-white border border-gray-400 shadow cursor-grab"
          style={{ left: `${endPercent}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setActive("end");
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setActive("end");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange({ start, end: clamp(end - 1, start, max) });
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange({ start, end: clamp(end + 1, start, max) });
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function useDashboardData(params: { startYear?: number | null; endYear?: number | null; nature?: string | null; top?: number | null }) {
  const { startYear, endYear, nature, top } = params;
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL("/api/retraction-watch", window.location.origin);
    if (startYear != null) url.searchParams.set("startYear", String(startYear));
    if (endYear != null) url.searchParams.set("endYear", String(endYear));
    if (nature) url.searchParams.set("nature", nature);
    if (top != null) url.searchParams.set("top", String(top));
    setLoading(true);
    setError(null);
    fetch(url.toString(), { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((json: ApiResponse) => setData(json))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Unknown error");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [startYear, endYear, nature, top]);

  return { data, loading, error };
}

function BarChart({ data, width = 800, height = 420, label = "" }: { data: Array<{ name: string; count: number }>; width?: number; height?: number; label?: string }) {
  const paddingLeft = 140;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 32;

  const maxCount = data.reduce((m, d) => Math.max(m, d.count), 0);
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  const barHeight = Math.max(10, Math.min(28, Math.floor(innerHeight / Math.max(1, data.length)) - 6));
  const gap = 6;

  return (
    <svg width={width} height={height} role="img" aria-label={label}>
      <g transform={`translate(${paddingLeft},${paddingTop})`}>
        {data.map((d, i) => {
          const y = i * (barHeight + gap);
          const w = maxCount > 0 ? Math.max(2, Math.round((d.count / maxCount) * innerWidth)) : 0;
          return (
            <g key={d.name} transform={`translate(0,${y})`}>
              <rect x={0} y={0} width={w} height={barHeight} fill="#60a5fa" rx={4} ry={4} />
              <text x={-10} y={barHeight / 2} dominantBaseline="middle" textAnchor="end" fontSize={12} fill="currentColor">
                {d.name}
              </text>
              <text x={w + 6} y={barHeight / 2} dominantBaseline="middle" fontSize={12} fill="currentColor">
                {numberFormatter(d.count)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function LineChart({ data, width = 800, height = 220, label = "", domainStart, domainEnd }: { data: TimelineDatum[]; width?: number; height?: number; label?: string; domainStart?: number; domainEnd?: number }) {
  const paddingLeft = 40;
  const paddingRight = 12;
  const paddingTop = 10;
  const paddingBottom = 28;

  const years = data.map((d) => d.year);
  const counts = data.map((d) => d.count);
  const minYear = domainStart != null ? domainStart : years.length ? Math.min(...years) : 0;
  const maxYear = domainEnd != null ? domainEnd : years.length ? Math.max(...years) : 1;
  const maxCount = counts.length ? Math.max(...counts) : 1;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  function xScale(y: number): number {
    if (maxYear === minYear) return paddingLeft + innerWidth / 2;
    return paddingLeft + ((y - minYear) / (maxYear - minYear)) * innerWidth;
  }

  function yScale(c: number): number {
    if (maxCount === 0) return paddingTop + innerHeight;
    return paddingTop + innerHeight - (c / maxCount) * innerHeight;
  }

  const pathD = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xScale(d.year)},${yScale(d.count)}`)
    .join(" ");

  const ticksX = useMemo(() => {
    const ticks: number[] = [];
    const span = maxYear - minYear;
    const step = span > 20 ? 5 : span > 10 ? 2 : 1;
    for (let y = minYear; y <= maxYear; y += step) ticks.push(y);
    return ticks;
  }, [minYear, maxYear]);

  const ticksY = useMemo(() => {
    const ticks: number[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) ticks.push(Math.round((i * maxCount) / steps));
    return ticks;
  }, [maxCount]);

  return (
    <svg width={width} height={height} role="img" aria-label={label}>
      <g>
        {ticksX.map((y) => (
          <g key={y}>
            <line x1={xScale(y)} y1={paddingTop} x2={xScale(y)} y2={paddingTop + innerHeight} stroke="#e5e7eb" />
            <text x={xScale(y)} y={paddingTop + innerHeight + 18} textAnchor="middle" fontSize={11} fill="currentColor">
              {y}
            </text>
          </g>
        ))}
        {ticksY.map((c) => (
          <g key={c}>
            <line x1={paddingLeft} y1={yScale(c)} x2={paddingLeft + innerWidth} y2={yScale(c)} stroke="#e5e7eb" />
            <text x={paddingLeft - 6} y={yScale(c)} dominantBaseline="middle" textAnchor="end" fontSize={11} fill="currentColor">
              {numberFormatter(c)}
            </text>
          </g>
        ))}
        <path d={pathD} fill="none" stroke="#60a5fa" strokeWidth={2} />
      </g>
    </svg>
  );
}

export default function RetractionWatchDashboardPage() {
  const [nature, setNature] = useState<string>("Retraction");
  const [topN, setTopN] = useState<number>(25);
  const [yearRange, setYearRange] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });

  const { data, loading, error } = useDashboardData({
    startYear: yearRange.start,
    endYear: yearRange.end,
    nature,
    top: topN,
  });

  useEffect(() => {
    if (!data) return;
    if (yearRange.start == null && data.yearMin != null) setYearRange((r) => ({ ...r, start: data.yearMin! }));
    if (yearRange.end == null && data.yearMax != null) setYearRange((r) => ({ ...r, end: data.yearMax! }));
  }, [data, yearRange.start, yearRange.end]);

  const journalData = data?.journals ?? [];
  const reasonData = data?.reasons ?? [];
  const displayTimeline = useMemo(() => {
    const base = data?.timeline ?? [];
    if (yearRange.start == null || yearRange.end == null) return base;
    return fillTimelineGaps(base, yearRange.start, yearRange.end);
  }, [data?.timeline, yearRange.start, yearRange.end]);

  return (
    <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-8">
      <h1 className="text-2xl font-semibold mb-2">Retraction Watch Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Interactive view of retractions with filters for year and notice type.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded">
          <div className="text-xs text-gray-500">Total records</div>
          <div className="text-xl font-medium">{data ? numberFormatter(data.total) : "—"}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-xs text-gray-500">Filtered records</div>
          <div className="text-xl font-medium">{data ? numberFormatter(data.filteredTotal) : "—"}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-xs text-gray-500">Year span</div>
          <div className="text-xl font-medium">
            {data && data.yearMin != null && data.yearMax != null ? `${data.yearMin}–${data.yearMax}` : "—"}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <label className="block text-sm mb-1">Notice type</label>
          <select className="border rounded px-3 py-2 w-full text-sm" value={nature} onChange={(e) => setNature(e.target.value)}>
            <option>Retraction</option>
            <option>Correction</option>
            <option>Expression of concern</option>
            <option>Reinstatement</option>
          </select>
        </div>
        <div className="p-4 border rounded">
          <label className="block text-sm mb-1">Top N journals</label>
          <input
            type="number"
            min={5}
            max={100}
            step={5}
            className="border rounded px-3 py-2 w-full text-sm"
            value={topN}
            onChange={(e) => setTopN(Math.max(5, Math.min(100, Number(e.target.value) || 25)))}
          />
        </div>
      </div>

      <div className="p-4 border rounded mb-6">
        <label className="block text-sm mb-2">Year range</label>
        <div className="space-y-3">
          <div className="text-sm">
            Selected: {yearRange.start ?? "—"} – {yearRange.end ?? "—"}
          </div>
          {data && data.yearMin != null && data.yearMax != null && yearRange.start != null && yearRange.end != null ? (
            <DualRangeSlider
              min={data.yearMin}
              max={data.yearMax}
              start={yearRange.start}
              end={yearRange.end}
              onChange={(range) => setYearRange(range)}
            />
          ) : (
            <div className="text-sm text-gray-500">Loading range…</div>
          )}
          <div className="flex">
            <button
              className="ml-auto border rounded px-3 py-2 text-sm"
              onClick={() => setYearRange({ start: data?.yearMin ?? null, end: data?.yearMax ?? null })}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-lg font-medium mb-2">Journals with most retractions</h2>
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : journalData.length ? (
            <BarChart data={journalData} label="Top journals by retraction count" />
          ) : (
            <div className="text-sm text-gray-500">No data for selected filters.</div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-medium mb-2">Most common reasons</h2>
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : reasonData.length ? (
            <BarChart data={reasonData} label="Top reasons by frequency" />
          ) : (
            <div className="text-sm text-gray-500">No data for selected filters.</div>
          )}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-lg font-medium mb-2">Retractions over time</h2>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : displayTimeline.length ? (
          <LineChart
            data={displayTimeline}
            label="Retractions per year"
            domainStart={yearRange.start ?? undefined}
            domainEnd={yearRange.end ?? undefined}
          />
        ) : (
          <div className="text-sm text-gray-500">No data for selected filters.</div>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <div>
          Source: Retraction Watch dataset (see description in the data folder). Some records may lack complete metadata; counts reflect available fields and filters.
        </div>
        <div>
          Tips: Click in inputs to adjust filters. Increase Top N to see more journals; switch notice type to compare patterns.
        </div>
      </div>
    </div>
  );
}


