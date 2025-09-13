import { getJSON } from "../getJSON";

export type BuildingProvider = {
  id: string;
  name: string;
};

export type BuildingTenant = {
  id: string;
  name: string;
  contractId: string | null;
};

export type BuildingSummary = {
  id: string;
  buildingId: string;
  address: string;
  provider: BuildingProvider | null;
  tenants: BuildingTenant[];
};

export async function fetchBuildings(params: {
  landlordId: string;
}): Promise<BuildingSummary[]> {
  const qs = new URLSearchParams({ landlordId: params.landlordId });
  return getJSON<BuildingSummary[]>(`/api/buildings?${qs.toString()}`);
}
