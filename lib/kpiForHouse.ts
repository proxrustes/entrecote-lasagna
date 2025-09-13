import { MOCK_HOUSES } from "../app/dashboard/page";

// --- Common helpers
export function kpiForHouse(house: (typeof MOCK_HOUSES)[number]) {
  const sumConsumption =
    house.units
      .flatMap((u) => u.consumptionLog)
      .reduce((a, d) => a + d.kWh, 0) +
    house.generalConsumptionLog.reduce((a, d) => a + d.kWh, 0);
  const sumPV = house.pvGenerationLog.reduce((a, d) => a + d.kWh, 0);
  const selfSuff = sumConsumption > 0 ? (sumPV / sumConsumption) * 100 : 0;
  // mock: each PV kWh saves €0.30 if used locally (cap by consumption)
  const localUse = Math.min(sumPV, sumConsumption);
  const savings = localUse * 0.3;
  return { sumConsumption, sumPV, selfSuff, savings };
}
