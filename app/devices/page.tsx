"use client";
import * as React from "react";
import { Stack, Typography, CircularProgress, Alert } from "@mui/material";
import { useSession } from "next-auth/react";
import { DevicesGrid } from "../../components/devices/DevicesGrid";
import type { DeviceRow } from "../../components/devices/types";
import { ApiDevice, getDevices } from "../../services/devices";

const normalizeStatus = (s?: string): DeviceRow["status"] => {
  const v = (s || "").toLowerCase();
  if (v === "online" || v === "degraded" || v === "maintenance" || v === "error") return v;
  return "offline";
};

// Generate realistic mock data for enhanced UI demonstration
const generateMockEnhancements = (d: ApiDevice, index: number): Partial<DeviceRow> => {
  const mockStatuses: DeviceRow["status"][] = ["online", "online", "online", "degraded", "maintenance", "error", "offline"];
  const mockStatus = mockStatuses[index % mockStatuses.length];

  // Generate realistic efficiency based on status
  const baseEfficiency = mockStatus === "online" ? 85 + Math.random() * 10 :
                        mockStatus === "degraded" ? 65 + Math.random() * 15 :
                        mockStatus === "maintenance" ? 0 :
                        mockStatus === "error" ? 20 + Math.random() * 30 :
                        0;

  // Generate recent trend data (24 hours of mock generation)
  const trendData: number[] = [];
  for (let i = 0; i < 24; i++) {
    const hour = new Date().getHours() - i;
    const dayTime = hour >= 6 && hour <= 18;
    const peakTime = hour >= 10 && hour <= 14;

    let value = 0;
    if (dayTime && mockStatus !== "offline" && mockStatus !== "maintenance") {
      value = peakTime ? 3 + Math.random() * 2 : 1 + Math.random() * 1.5;
      if (mockStatus === "degraded") value *= 0.7;
      if (mockStatus === "error") value *= 0.3;
    }
    trendData.push(Math.max(0, value));
  }

  return {
    status: mockStatus,
    efficiency: Math.round(baseEfficiency),
    capacity: 5 + (index % 3) * 2.5, // 5-10 kW panels
    temperature: 35 + Math.random() * 25, // 35-60°C
    maintenanceDate: mockStatus === "maintenance" ?
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() :
      new Date(Date.now() + (30 + index * 15) * 24 * 60 * 60 * 1000).toISOString(),
    alertsCount: mockStatus === "error" ? 2 + Math.floor(Math.random() * 3) :
                 mockStatus === "degraded" ? 1 :
                 0,
    generationTrend: trendData.reverse(), // Recent first
  };
};

const apiToRow = (d: ApiDevice, index: number): DeviceRow => {
  const enhancements = generateMockEnhancements(d, index);

  return {
    id: d.id,
    name: `Solar Panel ${String.fromCharCode(65 + index)}`, // Panel A, B, C, etc.
    address: d.buildingAddress,
    status: enhancements.status || normalizeStatus(d.status),
    lastReadingAt: d.lastReading?.timestamp ?? "—",
    lastReadingValue: d.lastReading?.kWh,
    kwhProducedToday: d.todayKWh,
    kwhProducedTotal: d.totalKWh,
    ...enhancements,
  };
};

export default function DevicesPage() {
  const { data: session } = useSession();
  const landlordId = (session?.user as { id?: string })?.id;

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
        setRows(data.map((device, index) => apiToRow(device, index)));
      } catch (e: unknown) {
        if (!ignore) setError(e instanceof Error ? e.message : "Failed to load devices");
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

      {!loading && !error && rows && <DevicesGrid rows={rows} />}
    </Stack>
  );
}
