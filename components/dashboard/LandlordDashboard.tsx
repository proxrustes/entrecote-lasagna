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
import { useEffect, useState } from "react";
import { fetchConsumption } from "../../services/consumption";
import { fetchGeneration } from "../../services/generation";

const EUR_PER_KWH = 0.3;

export function LandlordDashboard() {
  const { data: session } = useSession();
  const landlordId = (session as any)?.user?.id as string | undefined;

  const [buildingIds, setBuildingIds] = useState<string[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<string>("");
  const [tenantIds, setTenantIds] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("all");

  const [buildingLoading, setBuildingLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sumCons, setSumCons] = useState(0);
  const [sumGen, setSumGen] = useState(0);
  const savings = Math.min(sumCons, sumGen) * EUR_PER_KWH;

  useEffect(() => {
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

  useEffect(() => {
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
        const ids = Array.from(
          new Set(
            rows
              .map((r) => r.userId)
              .filter((uid): uid is string => !!uid && uid !== landlordId)
          )
        ).sort();
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
    <Card>
      <CardContent>
        <Grid2 container spacing={3}>
          <Grid2 size={12}>
            <Alert severity="success" sx={{ borderRadius: 1 }}>
              <strong>You saved €{savings.toFixed(2)}</strong> this period
            </Alert>
          </Grid2>

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

          <Grid2 size={12}>
            <Typography variant="h6" gutterBottom>
              Consumption vs Generation
            </Typography>
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
          </Grid2>
        </Grid2>
      </CardContent>
    </Card>
  );
}
