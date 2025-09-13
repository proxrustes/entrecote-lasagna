import { getJSON } from "../getJSON";

export const CONSUMPTION_ENDPOINT = "/api/consumption";

export type ConsumptionData = {
  id: string;
  timestamp: string;
  consumptionKwh: number;
  userId: string;
  user: {
    name: string;
  };
  buildingId: string;
};

type Params = {
  landlordId: string;
  buildingId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
};

export async function fetchConsumption(params: Params): Promise<ConsumptionData[]> {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  if (params.userId) qs.set("userId", params.userId);
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  return getJSON<ConsumptionData[]>(
    `${CONSUMPTION_ENDPOINT}?${qs.toString()}`
  );
}