"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  fetchTenantCosts,
  isMoney,
  TenantCostsMoney,
} from "../../services/costs/costs.service";
import {
  BuildingSummary,
  fetchBuildings,
} from "../../services/buildings/buildings";

type Row = {
  tenantId: string;
  tenantName: string;
  contractId: string | null;
  buildingId: string;
  buildingAddress: string;
  providerName: string | null;
  costs?: TenantCostsMoney;
  error?: string;
};

function monthRangeISO(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export function LandlordMonthlyTenantCostsTable({
  landlordId,
}: {
  landlordId: string;
}) {
  const [{ startISO, endISO }] = React.useState(monthRangeISO());
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!landlordId) return;
    setLoading(true);
    setErr(null);
    try {
      const buildings: BuildingSummary[] = await fetchBuildings({ landlordId });

      const tenants: Row[] = buildings.flatMap((b) =>
        b.tenants.map((t) => ({
          tenantId: t.id,
          tenantName: t.name,
          contractId: t.contractId ?? null,
          buildingId: b.id,
          buildingAddress: b.address,
          providerName: b.provider?.name ?? null,
        }))
      );

      const withCosts = await Promise.all(
        tenants.map(async (r) => {
          try {
            const res = await fetchTenantCosts({
              userId: r.tenantId,
              startDate: startISO,
              endDate: endISO,
              unit: "money",
            });
            if (!isMoney(res)) throw new Error("Unexpected response format");
            return { ...r, costs: res as TenantCostsMoney };
          } catch (e: any) {
            return { ...r, error: e?.message ?? "Failed to load costs" };
          }
        })
      );

      setRows(withCosts);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [landlordId, startISO, endISO]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalAcrossTenants = rows.reduce((sum, r) => {
    if (!r.costs) return sum;
    return sum + r.costs.totalCost + r.costs.baseFee;
  }, 0);

  if (loading) return <CircularProgress />;
  if (err) return <Alert severity="error">{err}</Alert>;

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1.5}
        >
          <Typography variant="h6">
            Tenant costs —{" "}
            {new Date(startISO).toLocaleString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography color="text.secondary" variant="body2">
              Total billed: {totalAcrossTenants.toFixed(2)}{" "}
              {rows.find((r) => r.costs)?.costs?.currency ?? "EUR"}
            </Typography>
            <Button
              onClick={onRefresh}
              startIcon={<RefreshIcon />}
              size="small"
              disabled={refreshing}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tenant</TableCell>
              <TableCell>Contract</TableCell>
              <TableCell>Building</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell align="right">PV kWh</TableCell>
              <TableCell align="right">Grid kWh</TableCell>
              <TableCell align="right">PV €</TableCell>
              <TableCell align="right">Grid €</TableCell>
              <TableCell align="right">Base fee</TableCell>
              <TableCell align="right">Total €</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r) => {
              const c = r.costs;
              return (
                <TableRow key={`${r.tenantId}-${r.buildingId}`} hover>
                  <TableCell>{r.tenantName}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "mono" }}>
                      {r.contractId ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.buildingAddress}</TableCell>
                  <TableCell>{r.providerName ?? "—"}</TableCell>

                  <TableCell align="right">
                    {c ? c.breakdown.pvConsumption.toFixed(3) : "—"}
                  </TableCell>
                  <TableCell align="right">
                    {c ? c.breakdown.gridConsumption.toFixed(3) : "—"}
                  </TableCell>
                  <TableCell align="right">
                    {c ? c.pvCost.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell align="right">
                    {c ? c.gridCost.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell align="right">
                    {c ? c.baseFee.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell align="right">
                    {c ? (c.totalCost + c.baseFee).toFixed(2) : "—"}
                  </TableCell>
                  <TableCell>{c?.currency ?? "—"}</TableCell>
                  <TableCell>
                    {r.error ? (
                      <Chip size="small" label="Error" color="error" />
                    ) : c ? (
                      <Chip size="small" label="OK" color="success" />
                    ) : (
                      <Chip size="small" label="No data" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
