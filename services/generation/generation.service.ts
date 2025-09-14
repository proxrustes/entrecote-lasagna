import { getJSON } from "../getJSON";

export const GENERATION_ENDPOINT = "/api/generation";

export type GenerationData = {
  timestamp: string;
  deviceId: string;
  buildingId: string;
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
};

export async function fetchGeneration(
  params: Params
): Promise<GenerationData[]> {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  if (params.userId) qs.set("userId", params.userId);
  if (params.period) qs.set("period", params.period);

  return getJSON<GenerationData[]>(`${GENERATION_ENDPOINT}?${qs.toString()}`);
}
