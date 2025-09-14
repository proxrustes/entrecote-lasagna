// services/profit.ts
export type ProfitType = "combined" | "tenants" | "feeding";

export type ProfitQuery = {
  landlordId: string;
  buildingId?: string;
  type?: ProfitType;
};

export type ProfitResponse = {
  currency: string; // "EUR"
  timeRange: { start: string; end: string }; // ISO strings
  // present depending on `type`
  profitFromTenants?: number;
  profitFromFeeding?: number;
  totalProfit?: number;
};

export async function fetchProfit(
  params: ProfitQuery
): Promise<ProfitResponse> {
  const { landlordId, buildingId, type } = params;
  const qs = new URLSearchParams({ landlordId });
  if (buildingId) qs.set("buildingId", buildingId);
  if (type) qs.set("type", type);

  const res = await fetch(`/api/profit?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`profit ${res.status}`);
  const json = await res.json();
  // сервер вернёт Date как ISO-строки — норм
  return json as ProfitResponse;
}

// Удобные пресеты диапазонов
export type RangeKey = "today" | "week" | "month" | "year";
export function getPresetRange(key: RangeKey) {
  const end = new Date();
  const start = new Date(end);
  if (key === "today") start.setHours(0, 0, 0, 0);
  if (key === "week") start.setDate(end.getDate() - 7);
  if (key === "month") start.setMonth(end.getMonth() - 1);
  if (key === "year") start.setFullYear(end.getFullYear() - 1);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}
