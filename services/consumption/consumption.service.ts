import { getJSON } from "../getJSON";

export const CONSUMPTION_ENDPOINT = "/api/consumption";

export type ConsumptionData = {
  timestamp: string;
  userId: string;
  userName: string;
  kWh: number;
  dataPoints: number;
  period: string;
  aggregation: string;
  timeRange: {
    start: string;
    end: string;
  };
};

type Params = {
  landlordId: string;
  buildingId?: string;
  userId?: string;
  period?: "1day" | "1week" | "1month" | "1year";
  endDate?: string;
};

export async function fetchConsumption(
  params: Params
): Promise<ConsumptionData[]> {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  if (params.userId) qs.set("userId", params.userId);
  if (params.period) qs.set("period", params.period);

  return getJSON<ConsumptionData[]>(`${CONSUMPTION_ENDPOINT}?${qs.toString()}`);
}
