// services/generation.ts
import type { GenerationRow } from "../components/dashboard/ConsumptionVsGeneration";

type GenParams = {
  landlordId: string;
  buildingId?: string;
  startDate?: string; // ISO
  endDate?: string; // ISO
};

export async function fetchGeneration(
  params: GenParams
): Promise<GenerationRow[]> {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  if (params.buildingId) qs.set("buildingId", params.buildingId);
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  const res = await fetch(`/api/generation?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`generation`);
  }
  return (await res.json()) as GenerationRow[];
}
