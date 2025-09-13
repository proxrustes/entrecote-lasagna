"use client";
import * as React from "react";
import { Stack, Typography, CircularProgress, Alert } from "@mui/material";
import { useSession } from "next-auth/react";
import { DevicesTable } from "../../components/devices/DevicesTable";
import type { DeviceRow } from "../../components/devices/types";
import { ApiDevice, getDevices } from "../../services/devices";

const normalizeStatus = (s?: string): DeviceRow["status"] => {
  const v = (s || "").toLowerCase();
  if (v === "online" || v === "degraded") return v;
  return "offline";
};

const apiToRow = (d: ApiDevice): DeviceRow => ({
  id: d.id,
  name: d.deviceId,
  address: d.buildingAddress,
  status: normalizeStatus(d.status),
  lastReadingAt: d.lastReading?.timestamp ?? "—",
  lastReadingValue: d.lastReading?.kWh,
  kwhProducedToday: d.todayKWh,
  kwhProducedTotal: d.totalKWh,
});

export default function DevicesPage() {
  const { data: session } = useSession();
  const landlordId = (session as any)?.user?.id;

  const [rows, setRows] = React.useState<DeviceRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (!landlordId) throw new Error("No landlordId in session");

        const data = await getDevices(landlordId);
        if (ignore) return;
        setRows(data.map(apiToRow));
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "Failed to load devices");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [landlordId]);

  return (
    <Stack gap={2}>
      <Typography variant="h6" gutterBottom>
        Devices
      </Typography>

      {loading && <CircularProgress />}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 1 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && rows && <DevicesTable rows={rows} />}
    </Stack>
  );
}
