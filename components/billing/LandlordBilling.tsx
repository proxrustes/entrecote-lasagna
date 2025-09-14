"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Box, Stack, CircularProgress, Alert, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { LandlordMonthlyTenantCostsTable } from "./LandlordMonthlyTenantCostsTable";
import { useTenantCosts } from "../../services/costs/useTenantCosts";
import { MonthSelector } from "./MonthSelector";
import { TenantCostsChart } from "./TenantCostsChart";

export default function LandlordBilling() {
  const { data: session } = useSession();
  const landlordId = (session as any)?.user?.id ?? null;

  const [selectedMonth, setSelectedMonth] = React.useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { rows, loading, error, refresh } = useTenantCosts(
    landlordId,
    selectedMonth
  );

  if (!landlordId) return null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <MonthSelector
          selectedMonth={selectedMonth}
          onChange={setSelectedMonth}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => void refresh()}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {/* chart + table share the same `rows` */}
          <TenantCostsChart rows={rows} />
          <LandlordMonthlyTenantCostsTable rows={rows} />
        </>
      )}
    </Stack>
  );
}
