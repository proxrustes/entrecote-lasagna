// services/profit/useProfit.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProfit, ProfitQuery, ProfitResponse } from "./profit.service";

export function useProfit(params?: ProfitQuery) {
  const enabled = !!params?.landlordId;
  return useQuery<ProfitResponse>({
    queryKey: [
      "profit",
      params?.landlordId ?? "none",
      params?.buildingId ?? "all",
      params?.startDate ?? "auto",
      params?.endDate ?? "now",
      params?.type ?? "combined",
    ],
    enabled,
    queryFn: () => fetchProfit(params as ProfitQuery),
    placeholderData: (prev) => prev, // keep previous data while refetching
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
