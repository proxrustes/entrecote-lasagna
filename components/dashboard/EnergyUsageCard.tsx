// EnergyUsageCard.tsx
import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SolarPowerIcon from "@mui/icons-material/SolarPower";

export type TenantCostsMoneyMinimal = {
  pvCost: number;
  gridCost: number;
  baseFee: number;
  totalCost: number;
  currency?: string;
  breakdown: {
    totalConsumption: number;
    pvConsumption: number;
    pvRate: number;
    gridRate: number;
  };
};

function safePercent(a?: number, b?: number) {
  if (!a || !b || b === 0) return 0;
  return Math.round((a / b) * 100);
}

export function EnergyUsageCard({
  costData,
}: {
  costData: TenantCostsMoneyMinimal | null;
}) {
  const totalCons = costData?.breakdown?.totalConsumption ?? 0;
  const pvCons = costData?.breakdown?.pvConsumption ?? 0;
  const coveragePct = totalCons ? safePercent(pvCons, totalCons) : 0;

  const chipIsExcellent = totalCons ? pvCons / totalCons > 0.5 : false;

  return (
    <Grid size={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Energy Usage This Month
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={4}>
              <Stack alignItems="center" spacing={1}>
                <ElectricBoltIcon sx={{ fontSize: 40, color: "info.main" }} />
                <Typography variant="h5">
                  {totalCons ? Math.round(totalCons).toString() : "0"} kWh
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  Total Energy Used
                </Typography>
              </Stack>
            </Grid>

            <Grid size={4}>
              <Stack alignItems="center" spacing={1}>
                <SolarPowerIcon sx={{ fontSize: 40, color: "success.main" }} />
                <Typography variant="h5" color="success.main">
                  {pvCons ? Math.round(pvCons).toString() : "0"} kWh
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  From Solar (Cheaper!)
                </Typography>
              </Stack>
            </Grid>

            <Grid size={4}>
              <Stack alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background:
                      costData && chipIsExcellent
                        ? "linear-gradient(135deg, #4caf50, #66bb6a)"
                        : "linear-gradient(135deg, #ff9800, #ffb74d)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                >
                  {coveragePct}%
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  Solar Coverage
                </Typography>

                <Chip
                  label={chipIsExcellent ? "Excellent!" : "Good savings!"}
                  color={chipIsExcellent ? "success" : "primary"}
                  size="small"
                />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
}
