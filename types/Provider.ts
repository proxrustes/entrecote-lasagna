import { EnergyMix } from "./EnergyMix";

export type Provider = {
  id: string;
  name: string;
  contractId: string;
  startDate: string;
  endDate?: string;
  tariffEurPerKwh: number;
  energyMix: EnergyMix;
  contact: { email?: string; phone?: string; website?: string };
  active: boolean;
};
