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

export function LandlordMonthlyTenantCostsTable({ rows }: { rows: Row[] }) {
  const totalAcrossTenants = rows.reduce((sum, r) => {
    if (!r.costs) return sum;
    return sum + r.costs.totalCost + r.costs.baseFee;
  }, 0);

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1.5}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography color="text.secondary" variant="body2">
              Total billed: {totalAcrossTenants.toFixed(2)}{" "}
              {rows.find((r) => r.costs)?.costs?.currency ?? "EUR"}
            </Typography>
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
