// services/consumption.ts
import type { ConsumptionRow } from "../components/dashboard/ConsumptionVsGeneration";

type ConsParams = {
  landlordId: string;
  buildingId?: string;
  userId?: string;
  startDate?: string; // ISO
  endDate?: string; // ISO
};

export async function fetchConsumption(
  params: ConsParams
): Promise<ConsumptionRow[]> {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  if (params.userId) qs.set("userId", params.userId);
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  const res = await fetch(`/api/consumption?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`consumption`);
  }
  return (await res.json()) as ConsumptionRow[];
}
