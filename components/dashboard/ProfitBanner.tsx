// components/profit/SavingsBanner.tsx
"use client";

import * as React from "react";
import { Alert, Box, LinearProgress, Stack, Typography } from "@mui/material";
import { useQueries } from "@tanstack/react-query";

// --- very small service wrapper ---
type ProfitResponse = {
  profitFromTenants?: number;
  profitFromFeeding?: number;
  totalProfit?: number;
  currency: string;
  timeRange: { start: string; end: string };
};

async function fetchProfit(params: {
  landlordId: string;
  startDate?: string;
  endDate?: string;
  buildingId?: string;
}) {
  const qs = new URLSearchParams({
    landlordId: params.landlordId,
    type: "combined",
  });
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);
  if (params.buildingId) qs.set("buildingId", params.buildingId);

  const res = await fetch(`/api/profit?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`profit ${res.status}`);
  return (await res.json()) as ProfitResponse;
}

// --- date helpers ---
const iso = (d: Date) => d.toISOString();
function last30DaysRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: iso(start), endDate: iso(end) };
}
function allTimeRange() {
  return { startDate: "1970-01-01T00:00:00.000Z", endDate: iso(new Date()) };
}

// --- Banner component ---
export function SavingsBanner({
  landlordId,
  buildingId,
}: {
  landlordId: string;
  buildingId?: string; // optional (aggregate across all landlord buildings if omitted)
}) {
  const ranges = React.useMemo(
    () => ({
      lifetime: allTimeRange(),
      last30: last30DaysRange(),
    }),
    []
  );

  const [lifetimeQ, last30Q] = useQueries({
    queries: [
      {
        queryKey: ["profit", "lifetime", landlordId, buildingId],
        queryFn: () =>
          fetchProfit({ landlordId, buildingId, ...ranges.lifetime }),
        enabled: !!landlordId,
        staleTime: 30_000,
      },
      {
        queryKey: ["profit", "last30", landlordId, buildingId],
        queryFn: () =>
          fetchProfit({ landlordId, buildingId, ...ranges.last30 }),
        enabled: !!landlordId,
        staleTime: 30_000,
      },
    ],
  });

  const loading = lifetimeQ.isLoading || last30Q.isLoading;
  const error = lifetimeQ.error || last30Q.error;

  if (error) {
    const msg =
      (error as any)?.message ||
      (typeof error === "object" && error !== null && "toString" in error
        ? String(error)
        : "Failed to load savings");
    return (
      <Alert severity="error" variant="filled" sx={{ borderRadius: 1 }}>
        {msg}
      </Alert>
    );
  }

  const currency = lifetimeQ.data?.currency || "EUR";
  const fmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

  const lifetime =
    lifetimeQ.data?.totalProfit ??
    (lifetimeQ.data?.profitFromTenants ?? 0) +
      (lifetimeQ.data?.profitFromFeeding ?? 0);

  const last30 =
    last30Q.data?.totalProfit ??
    (last30Q.data?.profitFromTenants ?? 0) +
      (last30Q.data?.profitFromFeeding ?? 0);

  return (
    <Alert severity="success" variant="filled" sx={{ borderRadius: 1 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Typography fontWeight={800}>
          Lifetime savings: {fmt.format(lifetime || 0)}
        </Typography>
        <Typography sx={{ opacity: 0.95 }}>
          Last 30 days: {fmt.format(last30 || 0)}
          {buildingId ? ` · Building: ${buildingId}` : ""}
        </Typography>
      </Stack>
      {loading && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress />
        </Box>
      )}
    </Alert>
  );
}
