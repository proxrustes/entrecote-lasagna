import { GenerationRow } from "../components/dashboard/ConsumptionVsGeneration";

export async function fetchGeneration(params: {
  landlordId: string;
  buildingId?: string;
}) {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  const res = await fetch(`/api/generation?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`generation ${res.status}`);
  return (await res.json()) as GenerationRow[];
}
