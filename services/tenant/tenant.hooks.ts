import { useQuery } from "@tanstack/react-query";
import { fetchTenantLandlord } from "./tenant.service";

export function useTenantLandlord(userId?: string) {
  return useQuery({
    queryKey: ["tenant-landlord", userId],
    enabled: !!userId,
    queryFn: () => fetchTenantLandlord(userId as string),
    staleTime: 5 * 60 * 1000, // 5 minutes - this rarely changes
    refetchOnWindowFocus: false,
  });
}