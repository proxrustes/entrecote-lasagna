"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchBuildings, type BuildingSummary } from "./buildings";

export function useBuildings(landlordId?: string) {
  return useQuery<BuildingSummary[]>({
    queryKey: ["buildings", landlordId ?? "none"],
    enabled: !!landlordId,
    queryFn: () => fetchBuildings({ landlordId: landlordId! }),
    placeholderData: (p) => p,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
