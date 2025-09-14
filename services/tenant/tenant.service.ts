import { getJSON } from "../getJSON";

export const TENANT_LANDLORD_ENDPOINT = "/api/tenant/landlord";

export type TenantLandlordResponse = {
  landlordId: string;
};

export async function fetchTenantLandlord(userId: string): Promise<TenantLandlordResponse> {
  return getJSON<TenantLandlordResponse>(
    `${TENANT_LANDLORD_ENDPOINT}?userId=${userId}`
  );
}