import { useQuery } from "@tanstack/react-query";
import { fetchTenantCosts } from "./costs.service";

type Params = {
  userId: string;
  startDate?: string | Date;
  endDate?: string | Date;
  unit?: "money" | "kwh";
};

export function useTenantCosts(params?: Params) {
  return useQuery({
    queryKey: [
      "costs",
      params?.userId,
      params?.startDate,
      params?.endDate,
      params?.unit,
    ],
    enabled: !!params?.userId,
    queryFn: () => fetchTenantCosts(params as Params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
