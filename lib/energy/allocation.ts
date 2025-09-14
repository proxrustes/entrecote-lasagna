export type ConsumptionLike = {
  timestamp: Date;
  consumptionKwh: number;
};

export type GenerationLike = {
  timestamp: Date;
  generationKwh: number;
};

function bucketTs(date: Date): number {
  // Normalize to minute precision to align readings
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d.getTime();
}

/**
 * Per-interval PV allocation for a single tenant within a building.
 * For each timestamp t:
 *  - totalCons(t) = sum of all building users' consumption
 *  - pv(t)        = total PV generation of building devices
 *  - usedPv(t)    = min(totalCons(t), pv(t))
 *  - tenantShare  = tenantCons(t) / totalCons(t)
 *  - tenantPv(t)  = usedPv(t) * tenantShare
 *  - tenantGrid(t)= tenantCons(t) - tenantPv(t)
 */
export function allocateTenantEnergy(
  tenantConsumptions: ConsumptionLike[],
  buildingConsumptions: ConsumptionLike[],
  pvGenerations: GenerationLike[]
): { pvKwh: number; gridKwh: number; totalKwh: number } {
  const consTotalByTs = new Map<number, number>();
  const consTenantByTs = new Map<number, number>();
  const pvByTs = new Map<number, number>();

  for (const c of buildingConsumptions) {
    const k = bucketTs(c.timestamp);
    consTotalByTs.set(k, (consTotalByTs.get(k) ?? 0) + (Number.isFinite(c.consumptionKwh) ? c.consumptionKwh : 0));
  }
  for (const c of tenantConsumptions) {
    const k = bucketTs(c.timestamp);
    consTenantByTs.set(k, (consTenantByTs.get(k) ?? 0) + (Number.isFinite(c.consumptionKwh) ? c.consumptionKwh : 0));
  }
  for (const g of pvGenerations) {
    const k = bucketTs(g.timestamp);
    pvByTs.set(k, (pvByTs.get(k) ?? 0) + (Number.isFinite(g.generationKwh) ? g.generationKwh : 0));
  }

  // Iterate over all timestamps present in either cons or pv
  const keys = new Set<number>([...consTotalByTs.keys(), ...pvByTs.keys(), ...consTenantByTs.keys()]);

  let pvKwh = 0;
  let gridKwh = 0;
  let totalKwh = 0;

  for (const k of keys) {
    const totalCons = consTotalByTs.get(k) ?? 0;
    const tenantCons = consTenantByTs.get(k) ?? 0;
    const pv = pvByTs.get(k) ?? 0;

    if (tenantCons <= 0) continue;
    totalKwh += tenantCons;

    if (totalCons <= 0) {
      // No other consumption – all tenant consumption must be grid
      gridKwh += tenantCons;
      continue;
    }

    const usedPv = Math.min(pv, totalCons);
    const share = tenantCons / totalCons;
    const tenantPv = usedPv * share;
    pvKwh += tenantPv;
    gridKwh += tenantCons - tenantPv;
  }

  return { pvKwh, gridKwh, totalKwh };
}

