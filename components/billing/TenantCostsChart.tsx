// TenantCostsChart.tsx
import React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Card, CardContent, Typography } from "@mui/material";
import { TenantRow } from "../../services/costs/useTenantCosts";

type Props = {
  rows: TenantRow[]; // rows for a single month
  height?: number;
  maxCategories?: number; // optionally limit number of tenants shown
};

export function TenantCostsChart({ rows, height = 320, maxCategories }: Props) {
  // Map rows => dataset for BarChart. Use tenantName as category.
  // Filter/limit if required (e.g. many tenants).
  const data = rows
    .filter((r) => !!r.costs)
    .map((r) => ({
      tenant: r.tenantName || r.tenantId,
      pv: Number((r.costs?.pvCost ?? 0).toFixed(2)),
      grid: Number((r.costs?.gridCost ?? 0).toFixed(2)),
    }));

  const dataset = maxCategories ? data.slice(0, maxCategories) : data;

  // If no data, render placeholder
  if (!dataset.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1">No costs data to display</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Costs by tenant (EUR)
        </Typography>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <BarChart
            dataset={dataset}
            xAxis={[{ dataKey: "tenant", scaleType: "band" }]}
            series={[
              { dataKey: "pv", label: "PV €", stack: "costs" },
              { dataKey: "grid", label: "Grid €", stack: "costs" },
            ]}
            height={height}
            // visual tweaks:
            margin={{ left: 80, right: 20, top: 20, bottom: 60 }}
            yAxis={[{ width: 80 }]}
            // enable labels on bars if desired:
            // barLabel="value"
          />
        </div>
      </CardContent>
    </Card>
  );
}
