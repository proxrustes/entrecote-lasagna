import type { DeviceRow } from "./types";

export const DEVICES_MOCK: DeviceRow[] = [
  {
    id: "d1",
    name: "Smart Meter #1",
    address: "123 Green St",
    status: "online",
    lastReadingAt: "2025-09-13T15:15:00Z",
    lastReadingValue: 22483.0,
    kwhProducedToday: 0,
  },
  {
    id: "d2",
    name: "Solar Inverter",
    address: "123 Green St",
    status: "online",
    lastReadingAt: "2025-09-13T15:15:00Z",
    kwhProducedToday: 6.45,
  },
  {
    id: "d3",
    name: "Battery Pack",
    address: "45 Solar Ave",
    status: "offline",
    lastReadingAt: "2025-09-13T14:50:00Z",
    kwhProducedToday: 0,
  },
];
