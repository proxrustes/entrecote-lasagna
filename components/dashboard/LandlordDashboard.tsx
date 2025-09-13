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
import Grid2 from "@mui/material/Grid";
import { useSession } from "next-auth/react";
import { ConsumptionVsGenerationChart } from "./ConsumptionVsGeneration";
import { useBuildings } from "../../services/buildings/useBuildings"; // ← поправь путь к твоему хуку
import { SavingsBanner } from "./ProfitBanner";

const EUR_PER_KWH = 0.3 as const;

type RangeKey = "today" | "week" | "month" | "year";
function getRange(k: RangeKey) {
  const end = new Date();
  const start = new Date(end);
  if (k === "today") start.setHours(0, 0, 0, 0);
  if (k === "week") start.setDate(end.getDate() - 7);
  if (k === "month") start.setMonth(end.getMonth() - 1);
  if (k === "year") start.setFullYear(end.getFullYear() - 1);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function LandlordDashboard() {
  const { data: session } = useSession();
  const landlordId = (session as any)?.user?.id as string | undefined;

  // buildings via API
  const {
    data: buildings,
    isLoading: bLoading,
    isFetching: bFetching,
    error,
  } = useBuildings(landlordId);

  // selected building / tenant / time
  const [selectedHouse, setSelectedHouse] = React.useState<string>("");
  const [selectedTenant, setSelectedTenant] = React.useState<string>("all");
  const [rangeKey, setRangeKey] = React.useState<RangeKey>("month");

  // sums for banner
  const [sumCons, setSumCons] = React.useState(0);
  const [sumGen, setSumGen] = React.useState(0);
  const savings = Math.min(sumCons, sumGen) * EUR_PER_KWH;

  // pick default house when buildings arrive
  React.useEffect(() => {
    if (!selectedHouse && buildings?.length) {
      setSelectedHouse(buildings[0].id);
      setSelectedTenant("all");
    }
  }, [buildings, selectedHouse]);

  if (!landlordId) return <Alert severity="warning">No landlord ID</Alert>;
  if (error) return <Alert severity="error">{String(error)}</Alert>;
  if (!buildings?.length && !bLoading)
    return <Alert severity="info">No data</Alert>;

  // current building + tenant options
  const current = buildings?.find((b) => b.id === selectedHouse);
  const tenantOptions =
    current?.tenants?.map((t) => ({ id: t.id, label: t.name || t.id })) ?? [];

  return (
    <Card>
      <CardContent>
        <Grid2 container spacing={3}>
          <Grid2 size={12}>
            <SavingsBanner landlordId={landlordId} />
          </Grid2>

          {/* House */}
          <Grid2 size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth disabled={bLoading}>
              <InputLabel>House</InputLabel>
              <Select
                value={selectedHouse}
                label="House"
                onChange={(e) => {
                  setSelectedHouse(e.target.value as string);
                  setSelectedTenant("all");
                }}
              >
                {(buildings ?? []).map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.address || b.buildingId || b.id}
                  </MenuItem>
                ))}
              </Select>
              {(bLoading || bFetching) && <LinearProgress sx={{ mt: 1 }} />}
            </FormControl>
          </Grid2>

          {/* Tenant */}
          <Grid2 size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth disabled={!current}>
              <InputLabel>Tenant</InputLabel>
              <Select
                value={selectedTenant}
                label="Tenant"
                onChange={(e) => setSelectedTenant(e.target.value as string)}
              >
                <MenuItem value="all">All</MenuItem>
                {tenantOptions.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid2>

          {/* Time range */}
          <Grid2 size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Range</InputLabel>
              <Select
                value={rangeKey}
                label="Range"
                onChange={(e) => setRangeKey(e.target.value as RangeKey)}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last week</MenuItem>
                <MenuItem value="month">Last month</MenuItem>
                <MenuItem value="year">Last year</MenuItem>
              </Select>
            </FormControl>
          </Grid2>

          <Grid2 size={12}>
            <Typography variant="h6" gutterBottom>
              Consumption vs Generation
            </Typography>
            {selectedHouse ? (
              <ConsumptionVsGenerationChart
                landlordId={landlordId}
                houseId={selectedHouse}
                tenantId={selectedTenant === "all" ? undefined : selectedTenant}
                height={320}
                onStats={({ sumConsumption, sumGeneration }) => {
                  setSumCons(sumConsumption);
                  setSumGen(sumGeneration);
                }}
              />
            ) : (
              <Alert severity="info">Pick a house</Alert>
            )}
          </Grid2>
        </Grid2>
      </CardContent>
    </Card>
  );
}
