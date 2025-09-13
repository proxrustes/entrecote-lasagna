import { PieChart } from "@mui/x-charts";
import { EnergyMix } from "../../types/EnergyMix";

export function MixPie({ mix }: { mix: EnergyMix }) {
  const data = [
    { id: "Coal", label: "Coal", value: mix.coal },
    { id: "Gas", label: "Gas", value: mix.gas },
    { id: "Wind", label: "Wind", value: mix.wind },
    { id: "Hydro", label: "Hydro", value: mix.hydro },
    { id: "Solar", label: "Solar", value: mix.solar },
    { id: "Nuclear", label: "Nuclear", value: mix.nuclear },
    { id: "Other", label: "Other", value: mix.other },
  ];
  return <PieChart series={[{ data, innerRadius: 40 }]} height={400} />;
}
