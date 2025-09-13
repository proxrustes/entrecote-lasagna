// components/charts/ConsumptionVsGeneration.tsx
"use client";

import * as React from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import { LineChart } from "@mui/x-charts";

type ConsumptionRow = {
  timestamp: string;
  userId: string;
  buildingId: string;
  kWh: number;
};
type GenerationRow = {
  timestamp: string;
  deviceId: string;
  buildingId: string;
  kWh: number;
};

type Props = {
  landlordId: string; // обязателен
  houseId?: string; // buildingId
  tenantId?: string; // userId (если не задан – берём всех доступных)
  height?: number; // высота чарта (по умолчанию 320)
  onStats?: (s: {
    timestamps: Date[];
    sumConsumption: number;
    sumGeneration: number;
  }) => void; // опционально: вернёт суммы родителю
};

const toMs = (iso: string) => new Date(iso).getTime();

function aggregateByTimestamp(rows: { timestamp: string; kWh: number }[]) {
  const map = new Map<number, number>();
  for (const r of rows) {
    const t = toMs(r.timestamp);
    map.set(t, (map.get(t) ?? 0) + (Number.isFinite(r.kWh) ? r.kWh : 0));
  }
  return map;
}

function buildTimeline(
  consMap: Map<number, number>,
  genMap: Map<number, number>
) {
  const keys = new Set<number>([...consMap.keys(), ...genMap.keys()]);
  const ts = Array.from(keys).sort((a, b) => a - b);
  const cons = ts.map((t) => consMap.get(t) ?? 0);
  const gen = ts.map((t) => genMap.get(t) ?? 0);
  return { ts, cons, gen };
}

async function fetchGeneration(params: {
  landlordId: string;
  buildingId?: string;
}) {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  const res = await fetch(`/api/generation?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`generation ${res.status}`);
  return (await res.json()) as GenerationRow[];
}

async function fetchConsumption(params: {
  landlordId: string;
  buildingId?: string;
  userId?: string;
}) {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  if (params.userId) qs.set("userId", params.userId);
  const res = await fetch(`/api/consumption?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`consumption ${res.status}`);
  return (await res.json()) as ConsumptionRow[];
}

export function ConsumptionVsGenerationChart({
  landlordId,
  houseId,
  tenantId,
  height = 320,
  onStats,
}: Props) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [timestamps, setTimestamps] = React.useState<Date[]>([]);
  const [seriesCons, setSeriesCons] = React.useState<number[]>([]);
  const [seriesGen, setSeriesGen] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!landlordId) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [gRows, cRows] = await Promise.all([
          fetchGeneration({ landlordId, buildingId: houseId }),
          fetchConsumption({
            landlordId,
            buildingId: houseId,
            userId: tenantId,
          }),
        ]);

        if (ignore) return;

        const genMap = aggregateByTimestamp(gRows);
        const consMap = aggregateByTimestamp(cRows);
        const { ts, cons, gen } = buildTimeline(consMap, genMap);

        const tsDates = ts.map((ms) => new Date(ms));
        setTimestamps(tsDates);
        setSeriesCons(cons);
        setSeriesGen(gen);

        if (onStats) {
          const sumConsumption = cons.reduce((a, v) => a + v, 0);
          const sumGeneration = gen.reduce((a, v) => a + v, 0);
          onStats({ timestamps: tsDates, sumConsumption, sumGeneration });
        }
      } catch (e: any) {
        if (!ignore) setErr(e?.message ?? "load failed");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [landlordId, houseId, tenantId, onStats]);

  if (loading) {
    return <CircularProgress />;
  }
  if (err) return <Alert severity="error">{err}</Alert>;
  if (!timestamps.length) return <Alert severity="info">No data</Alert>;

  return (
    <Box sx={{ width: "100%", height }}>
      <LineChart
        xAxis={[{ data: timestamps, scaleType: "time" }]}
        series={[
          { id: "cons", label: "Consumption", data: seriesCons },
          { id: "gen", label: "Generation", data: seriesGen },
        ]}
      />
    </Box>
  );
}
