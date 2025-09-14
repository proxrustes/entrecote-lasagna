import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInvoices,
  generateInvoice,
  downloadInvoice,
  GenerateInvoiceParams
} from "./invoices.service";

export function useInvoices(userId?: string) {
  return useQuery({
    queryKey: ["invoices", userId],
    enabled: true, // Always enabled - API handles filtering
    queryFn: () => fetchInvoices(userId),
    staleTime: 60_000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: GenerateInvoiceParams) => generateInvoice(params),
    onSuccess: (data, variables) => {
      // Invalidate invoices query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.userId] });
    },
  });
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const blob = await downloadInvoice(invoiceId);
      return { blob, invoiceId };
    },
  });
}