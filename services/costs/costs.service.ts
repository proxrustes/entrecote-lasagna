import { getJSON } from "../getJSON";

export const TENANT_COSTS_ENDPOINT = "/api/costs";

export type TenantCostsKwh = {
  pvConsumption: number;
  gridConsumption: number;
  totalConsumption: number;
  unit: "kWh";
  timeRange: { start: string; end: string }; // ISO
};

export type TenantCostsMoney = {
  pvCost: number;
  gridCost: number;
  totalCost: number;
  baseFee: number;
  currency: string;
  breakdown: {
    pvConsumption: number;
    gridConsumption: number;
    totalConsumption: number;
    pvRate: number;
    gridRate: number;
  };
  timeRange: { start: string; end: string }; // ISO
};

export type TenantCostsResponse = TenantCostsKwh | TenantCostsMoney;

type Params = {
  userId: string;
  startDate?: string | Date;
  endDate?: string | Date;
  unit?: "money" | "kwh";
};

const toISO = (d: string | Date) =>
  typeof d === "string" ? new Date(d).toISOString() : d.toISOString();

export async function fetchTenantCosts({
  userId,
  startDate,
  endDate,
  unit = "money",
}: Params): Promise<TenantCostsResponse> {
  const qs = new URLSearchParams({ userId, unit });
  if (startDate) qs.set("startDate", toISO(startDate));
  if (endDate) qs.set("endDate", toISO(endDate));

  return getJSON<TenantCostsResponse>(
    `${TENANT_COSTS_ENDPOINT}?${qs.toString()}`
  );
}

export function isMoney(r: TenantCostsResponse): r is TenantCostsMoney {
  return (r as any)?.currency != null;
}
