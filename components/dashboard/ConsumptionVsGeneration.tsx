"use client";

import * as React from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { useConsumption } from "../../services/consumption/consumption.hooks";
import { useGeneration } from "../../services/generation/generation.hooks";

type Props = {
  landlordId: string;
  houseId?: string;
  tenantId?: string;
  height?: number;
  period?: "1day" | "1week" | "1month" | "1year";
  onStats?: (s: {
    timestamps: Date[];
    sumConsumption: number;
    sumGeneration: number;
  }) => void;
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

export function ConsumptionVsGenerationChart({
  landlordId,
  houseId,
  tenantId,
  height = 320,
  period,
  onStats,
}: Props) {
  const consQuery = useConsumption({
    landlordId,
    buildingId: houseId,
    userId: tenantId,
    period,
  });

  const genQuery = useGeneration({
    landlordId,
    buildingId: houseId,
    period,
  });

  const isLoading =
    consQuery.isLoading ||
    genQuery.isLoading ||
    consQuery.isFetching ||
    genQuery.isFetching;

  const consumptionRows = consQuery.data ?? [];
  const generationRows = genQuery.data ?? [];

  const { timestamps, seriesCons, seriesGen } = React.useMemo(() => {
    const consMap = aggregateByTimestamp((consumptionRows as any) || []);
    const genMap = aggregateByTimestamp((generationRows as any) || []);
    const { ts, cons, gen } = buildTimeline(consMap, genMap);
    const tsDates = ts.map((ms) => new Date(ms));
    return { timestamps: tsDates, seriesCons: cons, seriesGen: gen };
  }, [consumptionRows, generationRows]);

  React.useEffect(() => {
    if (!onStats) return;
    const sumConsumption = seriesCons.reduce((a, v) => a + v, 0);
    const sumGeneration = seriesGen.reduce((a, v) => a + v, 0);
    onStats({ timestamps, sumConsumption, sumGeneration });
  }, [timestamps, seriesCons, seriesGen, onStats]);

  const error = consQuery.error ?? genQuery.error;

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <Alert severity="error">{String((error as any)?.message ?? error)}</Alert>
    );
  }

  if (!timestamps.length) {
    return <Alert severity="info">No data</Alert>;
  }

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
