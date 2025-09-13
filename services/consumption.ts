import { ConsumptionRow } from "../components/dashboard/ConsumptionVsGeneration";

export async function fetchConsumption(params: {
  landlordId: string;
  buildingId?: string;
  userId?: string;
}) {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  if (params.userId) qs.set("userId", params.userId);
  const res = await fetch(`/api/consumption?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`consumption ${res.status}`);
  return (await res.json()) as ConsumptionRow[];
}
