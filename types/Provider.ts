export type Provider = {
  id: string;
  name: string;
  nuclearEnergyPct: number;
  coalEnergyPct: number;
  gasEnergyPct: number;
  miscFossilEnergyPct: number;
  solarEnergyPct: number;
  windEnergyPct: number;
  miscRenewableEnergyPct: number;
  createdAt?: string;
  updatedAt?: string;
};
