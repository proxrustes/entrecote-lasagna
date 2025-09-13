import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import { LineChart, BarChart } from "@mui/x-charts";
import { MOCK_HOUSES } from "../../app/dashboard/page";
import { kpiForHouse } from "../../lib/kpiForHouse";
import { CardHeader } from "./CardHeader";

export function TenantDashboard() {
  const house = MOCK_HOUSES[0];
  const unit = house.units[0];
  const { sumConsumption, sumPV, selfSuff } = kpiForHouse(house);
  const timestamps = house.pvGenerationLog.map((d) => d.timestamp);

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card>
          <CardContent sx={{ pb: 2 }}>
            <CardHeader
              address={house.address}
              name={unit.name}
              contractNumber="12345"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">My last bill</Typography>
            <Typography variant="h4">
              € {unit.bills.at(-1)?.amount ?? 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Building PV</Typography>
            <Typography variant="h4">{sumPV.toFixed(2)} kWh</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Self‑sufficiency</Typography>
            <Typography variant="h4">{selfSuff.toFixed(0)}%</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Charts: my unit vs building PV */}
      <Grid size={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              My unit consumption
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <LineChart
                xAxis={[{ data: unit.consumptionLog.map((d) => d.timestamp) }]}
                series={[
                  {
                    data: unit.consumptionLog.map((d) => d.kWh),
                    label: unit.name,
                  },
                ]}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Building PV generation
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <BarChart
                xAxis={[{ data: timestamps }]}
                series={[
                  {
                    data: house.pvGenerationLog.map((d) => d.kWh),
                    label: "PV",
                  },
                ]}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
