// components/dashboard/LandlordDashboard.tsx
"use client";

import * as React from "react";
import {
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  LinearProgress,
} from "@mui/material";
import Grid2 from "@mui/material/Grid"; // корректный Grid v2 с prop `size`
import { useSession } from "next-auth/react";
import { ConsumptionVsGenerationChart } from "./ConsumptionVsGeneration";

// === лёгкие фетчеры (только для списков, без общего "loading" страницы) ===
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

async function fetchGeneration(params: { landlordId: string }) {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  const res = await fetch(`/api/generation?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`generation ${res.status}`);
  return (await res.json()) as GenerationRow[];
}

async function fetchConsumption(params: {
  landlordId: string;
  buildingId?: string;
}) {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  const res = await fetch(`/api/consumption?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`consumption ${res.status}`);
  return (await res.json()) as ConsumptionRow[];
}

const EUR_PER_KWH = 0.3;

export function LandlordDashboard() {
  const { data: session } = useSession();
  const landlordId = (session as any)?.user?.id as string | undefined;

  const [buildingIds, setBuildingIds] = React.useState<string[]>([]);
  const [selectedHouse, setSelectedHouse] = React.useState<string>("");
  const [tenantIds, setTenantIds] = React.useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = React.useState<string>("all");

  const [buildingLoading, setBuildingLoading] = React.useState(false);
  const [tenantLoading, setTenantLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // KPI из дочернего графика (не блокируем страницу при смене фильтров)
  const [sumCons, setSumCons] = React.useState(0);
  const [sumGen, setSumGen] = React.useState(0);
  const selfSuff = sumCons > 0 ? (sumGen / sumCons) * 100 : 0;
  const savings = Math.min(sumCons, sumGen) * EUR_PER_KWH;

  // 1) initial: список домов (не перекрашиваем всю страницу)
  React.useEffect(() => {
    if (!landlordId) return;
    let ignore = false;
    (async () => {
      try {
        setBuildingLoading(true);
        setError(null);
        const [gRows, cRows] = await Promise.all([
          fetchGeneration({ landlordId }),
          fetchConsumption({ landlordId }),
        ]);
        if (ignore) return;
        const ids = new Set<string>();
        gRows.forEach((r) => ids.add(r.buildingId));
        cRows.forEach((r) => ids.add(r.buildingId));
        const arr = Array.from(ids);
        setBuildingIds(arr);
        setSelectedHouse((prev) => prev || arr[0] || "");
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "load failed");
      } finally {
        if (!ignore) setBuildingLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [landlordId]);

  // 2) при смене дома подтягиваем список tenantId (локальная индикация в селекте)
  React.useEffect(() => {
    if (!landlordId || !selectedHouse) return;
    let ignore = false;
    (async () => {
      try {
        setTenantLoading(true);
        setError(null);
        const rows = await fetchConsumption({
          landlordId,
          buildingId: selectedHouse,
        });
        if (ignore) return;
        const ids = Array.from(new Set(rows.map((r) => r.userId)));
        setTenantIds(ids);
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "load failed");
      } finally {
        if (!ignore) setTenantLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [landlordId, selectedHouse]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!landlordId)
    return <Alert severity="warning">No landlord ID in session</Alert>;
  if (!buildingIds.length && !buildingLoading)
    return <Alert severity="info">No data</Alert>;

  return (
    <Grid2 container spacing={3}>
      <Grid2 size={12}>
        <Alert severity="success" sx={{ borderRadius: 1 }}>
          <strong>You saved €{savings.toFixed(2)}</strong> this period
        </Alert>
      </Grid2>

      {/* Фильтры — не дёргаем разметку, только дизейблим и показываем тонкую полоску */}
      <Grid2 size={6}>
        <FormControl fullWidth disabled={buildingLoading}>
          <InputLabel>House</InputLabel>
          <Select
            value={selectedHouse}
            label="House"
            onChange={(e) => {
              setSelectedHouse(e.target.value as string);
              setSelectedTenant("all");
            }}
          >
            {buildingIds.map((id) => (
              <MenuItem key={id} value={id}>
                {id}
              </MenuItem>
            ))}
          </Select>
          {buildingLoading && <LinearProgress sx={{ mt: 1 }} />}
        </FormControl>
      </Grid2>

      <Grid2 size={6}>
        <FormControl fullWidth disabled={!selectedHouse || tenantLoading}>
          <InputLabel>Tenant</InputLabel>
          <Select
            value={selectedTenant}
            label="Tenant"
            onChange={(e) => setSelectedTenant(e.target.value as string)}
          >
            <MenuItem value="all">All</MenuItem>
            {tenantIds.map((tid) => (
              <MenuItem key={tid} value={tid}>
                {tid}
              </MenuItem>
            ))}
          </Select>
          {tenantLoading && <LinearProgress sx={{ mt: 1 }} />}
        </FormControl>
      </Grid2>

      {/* KPI — оставляем предыдущие значения до прихода новых onStats, чтобы не мигало */}
      <Grid2 size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Consumption</Typography>
            <Typography variant="h4">{sumCons.toFixed(2)} kWh</Typography>
          </CardContent>
        </Card>
      </Grid2>
      <Grid2 size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">PV Generation</Typography>
            <Typography variant="h4">{sumGen.toFixed(2)} kWh</Typography>
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

      {/* График — отдельный компонент сам фетчит и показывает спиннер ВНУТРИ себя, высота фиксирована */}
      <Grid2 size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Consumption vs Generation
            </Typography>
            <ConsumptionVsGenerationChart
              landlordId={landlordId}
              houseId={selectedHouse}
              tenantId={selectedTenant === "all" ? undefined : selectedTenant}
              height={320}
              onStats={({ sumConsumption, sumGeneration }) => {
                // плавное обновление без дёрганья
                setSumCons(sumConsumption);
                setSumGen(sumGeneration);
              }}
            />
          </CardContent>
        </Card>
      </Grid2>
    </Grid2>
  );
}
