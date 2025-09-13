export type DeviceRow = {
  id: string;
  name: string; // e.g. "Solar Inverter #1"
  address: string; // building/unit address
  status: "online" | "offline" | "degraded";
  lastReadingAt: string; // ISO or human string
  lastReadingValue?: number; // optional meter value
  kwhProducedToday: number; // production today
};
