// components/dashboard/LandlordDashboard.tsx
"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import Grid2 from "@mui/material/Grid"; // поддержка prop `size`
import { LineChart } from "@mui/x-charts";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

type ConsumptionPoint = {
  timestamp: string;
  userId: string;
  buildingId: string;
  kWh: number;
};

type GenerationPoint = {
  timestamp: string;
  deviceId: string;
  buildingId: string;
  kWh: number;
};

const LOCAL_EUR_PER_KWH = 0.3;

export function LandlordDashboard() {
  const { data: session } = useSession();
  const landlordId = (session as any)?.user?.id;

  const [selectedHouse, setSelectedHouse] = React.useState<string>("");
  const [selectedUnit, setSelectedUnit] = React.useState<string>("all");

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [cons, setCons] = React.useState<ConsumptionPoint[]>([]);
  const [gen, setGen] = React.useState<GenerationPoint[]>([]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        if (!landlordId) {
          setErr("Missing landlordId");
          return;
        }
        const [cRes, gRes] = await Promise.all([
          fetch(
            `/api/consumption?landlordId=${encodeURIComponent(landlordId)}`
          ),
          fetch(`/api/generation?landlordId=${encodeURIComponent(landlordId)}`),
        ]);
        if (!cRes.ok) throw new Error(`consumption: ${cRes.status}`);
        if (!gRes.ok) throw new Error(`generation: ${gRes.status}`);
        const cData: ConsumptionPoint[] = await cRes.json();
        const gData: GenerationPoint[] = await gRes.json();
        if (!ignore) {
          setCons(cData);
          setGen(gData);
          const firstBuilding =
            cData[0]?.buildingId || gData[0]?.buildingId || "";
          setSelectedHouse((prev) => prev || firstBuilding);
        }
      } catch (e: any) {
        if (!ignore) setErr(e?.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [landlordId]);

  // Дома из данных
  const buildingIds = React.useMemo(() => {
    const ids = new Set<string>();
    cons.forEach((p) => ids.add(p.buildingId));
    gen.forEach((p) => ids.add(p.buildingId));
    return Array.from(ids);
  }, [cons, gen]);

  // Юниты (userId) для выбранного дома
  const unitOptions = React.useMemo(() => {
    const ids = new Set<string>();
    cons
      .filter((p) => p.buildingId === selectedHouse)
      .forEach((p) => ids.add(p.userId));
    return ["all", ...Array.from(ids)];
  }, [cons, selectedHouse]);

  // Объединённые метки времени по дому
  const timestamps = React.useMemo(() => {
    const s = new Set<string>();
    cons
      .filter((p) => p.buildingId === selectedHouse)
      .forEach((p) => s.add(p.timestamp));
    gen
      .filter((p) => p.buildingId === selectedHouse)
      .forEach((p) => s.add(p.timestamp));
    return Array.from(s).sort();
  }, [cons, gen, selectedHouse]);

  // Две серии: Consumption и Generation
  const { seriesConsumption, seriesGeneration, sumConsumption, sumGeneration } =
    React.useMemo(() => {
      const cMap = new Map<string, number>(); // ts -> kWh (по выбранному юниту или сумме)
      const gMap = new Map<string, number>(); // ts -> kWh (сумма по устройствам)
      timestamps.forEach((ts) => {
        cMap.set(ts, 0);
        gMap.set(ts, 0);
      });

      // Consumption: либо сумма по всем, либо по выбранному userId
      const consFiltered =
        selectedUnit === "all"
          ? cons.filter((p) => p.buildingId === selectedHouse)
          : cons.filter(
              (p) => p.buildingId === selectedHouse && p.userId === selectedUnit
            );

      consFiltered.forEach((p) =>
        cMap.set(p.timestamp, (cMap.get(p.timestamp) || 0) + p.kWh)
      );

      // Generation: всегда суммарно по дому
      gen
        .filter((p) => p.buildingId === selectedHouse)
        .forEach((p) =>
          gMap.set(p.timestamp, (gMap.get(p.timestamp) || 0) + p.kWh)
        );

      const cSeries = timestamps.map((ts) => +(cMap.get(ts) || 0));
      const gSeries = timestamps.map((ts) => +(gMap.get(ts) || 0));
      const cSum = cSeries.reduce((a, v) => a + v, 0);
      const gSum = gSeries.reduce((a, v) => a + v, 0);

      return {
        seriesConsumption: cSeries,
        seriesGeneration: gSeries,
        sumConsumption: cSum,
        sumGeneration: gSum,
      };
    }, [timestamps, cons, gen, selectedHouse, selectedUnit]);

  const selfSuff =
    sumConsumption > 0 ? (sumGeneration / sumConsumption) * 100 : 0;
  const localUse = Math.min(sumGeneration, sumConsumption);
  const savings = localUse * LOCAL_EUR_PER_KWH;

  if (loading) {
    return <CircularProgress />;
  }

  if (err) {
    return (
      <Alert severity="error" sx={{ borderRadius: 1 }}>
        {err}
      </Alert>
    );
  }

  if (!selectedHouse) {
    return (
      <Alert severity="info" sx={{ borderRadius: 1 }}>
        No data for this landlord yet.
      </Alert>
    );
  }

  return (
    <Grid2 container spacing={3}>
      <Grid2 size={12}>
        <Alert severity="success" sx={{ borderRadius: 1 }}>
          <strong>You saved €{savings.toFixed(2)}</strong> this period
        </Alert>
      </Grid2>

      {/* Фильтры */}
      <Grid2 size={6}>
        <FormControl fullWidth>
          <InputLabel>House</InputLabel>
          <Select
            value={selectedHouse}
            label="House"
            onChange={(e) => {
              setSelectedHouse(e.target.value as string);
              setSelectedUnit("all");
            }}
          >
            {buildingIds.map((id) => (
              <MenuItem key={id} value={id}>
                {id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid2>

      <Grid2 size={6}>
        <FormControl fullWidth>
          <InputLabel>Unit (tenant)</InputLabel>
          <Select
            value={selectedUnit}
            label="Unit (tenant)"
            onChange={(e) => setSelectedUnit(e.target.value as string)}
          >
            {unitOptions.map((v) => (
              <MenuItem key={v} value={v}>
                {v === "all" ? "All" : v}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid2>

      {/* KPIs */}
      <Grid2 size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Consumption</Typography>
            <Typography variant="h4">
              {sumConsumption.toFixed(2)} kWh
            </Typography>
          </CardContent>
        </Card>
      </Grid2>
      <Grid2 size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">PV Generation</Typography>
            <Typography variant="h4">{sumGeneration.toFixed(2)} kWh</Typography>
          </CardContent>
        </Card>
      </Grid2>
      <Grid2 size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Self-sufficiency</Typography>
            <Typography variant="h4">{selfSuff.toFixed(0)}%</Typography>
          </CardContent>
        </Card>
      </Grid2>

      {/* ЕДИНСТВЕННЫЙ график: Consumption vs Generation */}
      <Grid2 size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Consumption vs Generation
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <LineChart
                xAxis={[{ data: timestamps }]}
                series={[
                  { id: "cons", label: "Consumption", data: seriesConsumption },
                  { id: "gen", label: "Generation", data: seriesGeneration },
                ]}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid2>
    </Grid2>
  );
}
