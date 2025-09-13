import { getJSON } from "../getJSON";

export const GENERATION_ENDPOINT = "/api/generation";

export type GenerationData = {
  id: string;
  timestamp: string;
  generationKwh: number;
  deviceId: string;
  device: {
    deviceId: string;
    buildingId: string;
  };
};

type Params = {
  landlordId: string;
  buildingId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
};

export async function fetchGeneration(params: Params): Promise<GenerationData[]> {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  if (params.userId) qs.set("userId", params.userId);
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  return getJSON<GenerationData[]>(
    `${GENERATION_ENDPOINT}?${qs.toString()}`
  );
}