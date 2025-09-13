"use client";
import * as React from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { Provider } from "../../types/Provider";

export function MixPie({
  p,
  width = 320,
  height = 220,
}: {
  p: Pick<
    Provider,
    | "nuclearEnergyPct"
    | "coalEnergyPct"
    | "gasEnergyPct"
    | "miscFossilEnergyPct"
    | "solarEnergyPct"
    | "windEnergyPct"
    | "miscRenewableEnergyPct"
  >;
  width?: number;
  height?: number;
}) {
  const data = [
    { id: "Nuclear", label: "Nuclear", value: p.nuclearEnergyPct },
    { id: "Coal", label: "Coal", value: p.coalEnergyPct },
    { id: "Gas", label: "Gas", value: p.gasEnergyPct },
    { id: "Wind", label: "Wind", value: p.windEnergyPct },
    { id: "Solar", label: "Solar", value: p.solarEnergyPct },
    { id: "Fossil*", label: "Misc Fossil", value: p.miscFossilEnergyPct },
    { id: "Renew*", label: "Misc Renewable", value: p.miscRenewableEnergyPct },
  ];
  return (
    <PieChart
      series={[{ data, innerRadius: 40 }]}
      width={width}
      height={height}
    />
  );
}
