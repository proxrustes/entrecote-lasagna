// components/devices/types.ts
export type DeviceRow = {
  id: string;
  name: string; // e.g. "Solar Inverter #1" (пока подставляем deviceId)
  address: string; // building address
  status: "online" | "offline" | "degraded" | "maintenance" | "error";
  lastReadingAt: string; // ISO или human string
  lastReadingValue?: number; // kWh последнего чтения
  kwhProducedToday: number; // суммарная генерация за сегодня
  kwhProducedTotal: number;
  // Enhanced fields for better UI
  efficiency?: number; // Performance percentage
  capacity?: number; // Panel capacity in kW
  temperature?: number; // Panel temperature
  maintenanceDate?: string; // Next maintenance date
  alertsCount?: number; // Number of active alerts
  generationTrend?: number[]; // Recent generation data for mini chart
};
