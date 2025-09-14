// LandlordDashboard.tsx
"use client";

import * as React from "react";
import {
  Alert,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import Grid2 from "@mui/material/Grid";
import { ConsumptionVsGenerationChart } from "./ConsumptionVsGeneration";
import { useBuildings } from "../../services/buildings/useBuildings";
import { RangeKey, mapRangeKeyToPeriod } from "./mapRangeKeyToPeriod";
import { HouseSelector } from "./HouseSelector";
import { RangeSelector } from "./RangeSelector";
import { TenantSelector } from "./TenantSelector";
import { SavingsBanner } from "./SavingsBanner";

const EUR_PER_KWH = 0.3 as const;

export function LandlordDashboard() {
  const { data: session } = useSession();
  const landlordId = (session as any)?.user?.id as string | undefined;

  const {
    data: buildings,
    isLoading: bLoading,
    isFetching: bFetching,
    error,
  } = useBuildings(landlordId);

  const [selectedHouse, setSelectedHouse] = React.useState<string>("");
  const [selectedTenant, setSelectedTenant] = React.useState<string>("all");
  const [rangeKey, setRangeKey] = React.useState<RangeKey>("month");

  const [sumCons, setSumCons] = React.useState(0);
  const [sumGen, setSumGen] = React.useState(0);
  const savings = Math.min(sumCons, sumGen) * EUR_PER_KWH;

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

  const current = buildings?.find((b) => b.id === selectedHouse);
  const tenantOptions =
    current?.tenants?.map((t) => ({ id: t.id, label: t.name || t.id })) ?? [];

  const period = React.useMemo(() => mapRangeKeyToPeriod(rangeKey), [rangeKey]);

  return (
    <Stack gap={2}>
      <SavingsBanner landlordId={landlordId} verb="Earned" />
      <Card>
        <CardContent>
          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 12, md: 4 }}>
              <HouseSelector
                buildings={buildings}
                value={selectedHouse}
                onChange={(id) => {
                  setSelectedHouse(id);
                  setSelectedTenant("all");
                }}
                disabled={false}
                loading={bLoading}
                fetching={bFetching}
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 4 }}>
              <TenantSelector
                options={tenantOptions}
                value={selectedTenant}
                onChange={setSelectedTenant}
                disabled={!current}
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 4 }}>
              <RangeSelector value={rangeKey} onChange={setRangeKey} />
            </Grid2>

            <Grid2 size={12}>
              <Typography variant="h6" gutterBottom>
                Consumption vs Generation
              </Typography>

              {selectedHouse ? (
                <ConsumptionVsGenerationChart
                  landlordId={landlordId}
                  houseId={selectedHouse}
                  tenantId={
                    selectedTenant === "all" ? undefined : selectedTenant
                  }
                  height={320}
                  period={period}
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
    </Stack>
  );
}
