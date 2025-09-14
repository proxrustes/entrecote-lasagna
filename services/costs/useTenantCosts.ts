import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchBuildings,
  BuildingSummary,
} from "../../services/buildings/buildings";
import {
  fetchTenantCosts,
  isMoney,
  TenantCostsMoney,
} from "../../services/costs/costs.service";

export type TenantRow = {
  tenantId: string;
  tenantName: string;
  contractId: string | null;
  buildingId: string;
  buildingAddress: string;
  providerName: string | null;
  costs?: TenantCostsMoney;
  error?: string;
};

function monthRangeISO(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export function useTenantCosts(landlordId: string | null, selectedMonth: Date) {
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // useRef to store latest call id for simple race-control / cancellation
  const callIdRef = useRef(0);

  const load = useCallback(async () => {
    const callId = ++callIdRef.current;
    if (!landlordId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { startISO, endISO } = monthRangeISO(selectedMonth);

    try {
      const buildings: BuildingSummary[] = await fetchBuildings({ landlordId });

      // If another call started meanwhile, bail out early
      if (callIdRef.current !== callId) return;

      const tenants: TenantRow[] = buildings.flatMap((b) =>
        b.tenants.map((t) => ({
          tenantId: t.id,
          tenantName: t.name,
          contractId: t.contractId ?? null,
          buildingId: b.id,
          buildingAddress: b.address,
          providerName: b.provider?.name ?? null,
        }))
      );

      const withCosts = await Promise.all(
        tenants.map(async (r) => {
          try {
            const res = await fetchTenantCosts({
              userId: r.tenantId,
              startDate: startISO,
              endDate: endISO,
              unit: "money",
            });

            if (callIdRef.current !== callId) {
              // aborted by a newer call
              return Promise.reject({ aborted: true });
            }

            if (!isMoney(res)) throw new Error("Unexpected response format");
            return { ...r, costs: res as TenantCostsMoney };
          } catch (e: any) {
            if (e && e.aborted) throw e;
            return { ...r, error: e?.message ?? "Failed to load costs" };
          }
        })
      );

      // final race check
      if (callIdRef.current !== callId) return;

      setRows(withCosts);
      setError(null);
    } catch (e: any) {
      if (e && e.aborted) return;
      setError(e?.message ?? "Failed to load data");
      setRows([]);
    } finally {
      if (callIdRef.current === callId) {
        setLoading(false);
      }
    }
  }, [landlordId, selectedMonth]);

  useEffect(() => {
    void load();
    // cleanup: increment callId to cancel previous inflight work
    return () => {
      callIdRef.current++;
    };
  }, [load]);

  return {
    rows,
    loading,
    error,
    refresh: load,
  };
}
