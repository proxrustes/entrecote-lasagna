import { useQuery } from "@tanstack/react-query";
import { fetchGeneration } from "./generation.service";

type Params = {
  landlordId: string;
  buildingId?: string;
  userId?: string;
  period?: '1day' | '1week' | '1month' | '1year';
  endDate?: string;
};

export function useGeneration(params?: Params) {
  return useQuery({
    queryKey: ["generation", params?.landlordId, params?.buildingId, params?.userId, params?.period, params?.endDate],
    enabled: !!params?.landlordId,
    queryFn: () => fetchGeneration(params as Params),
    placeholderData: (p) => p,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}