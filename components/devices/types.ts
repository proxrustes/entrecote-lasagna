// components/devices/types.ts
export type DeviceRow = {
  id: string;
  name: string; // e.g. "Solar Inverter #1" (пока подставляем deviceId)
  address: string; // building address
  status: "online" | "offline" | "degraded";
  lastReadingAt: string; // ISO или human string
  lastReadingValue?: number; // kWh последнего чтения
  kwhProducedToday: number; // суммарная генерация за сегодня
  kwhProducedTotal: number;
};
