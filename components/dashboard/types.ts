export type ConsumptionRow = {
  timestamp: string;
  userId: string;
  buildingId: string;
  kWh: number;
};
export type GenerationRow = {
  timestamp: string;
  deviceId: string;
  buildingId: string;
  kWh: number;
};
