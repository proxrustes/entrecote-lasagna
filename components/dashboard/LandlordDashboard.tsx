import {
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { LineChart, BarChart } from "@mui/x-charts";
import { MOCK_HOUSES } from "../../app/dashboard/page";
import { kpiForHouse } from "../../lib/kpiForHouse";
import { useState } from "react";

export function LandlordDashboard() {
  const [selectedHouse, setSelectedHouse] = useState(MOCK_HOUSES[0].id);
  const [selectedUnit, setSelectedUnit] = useState("all");
  const house = MOCK_HOUSES.find((h) => h.id === selectedHouse)!;
  const { sumConsumption, sumPV, selfSuff, savings } = kpiForHouse(house);
  const timestamps = house.pvGenerationLog.map((d) => d.timestamp);
  const unitsToShow =
    selectedUnit === "all"
      ? house.units
      : house.units.filter((u) => u.id === selectedUnit);

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Alert severity="success" sx={{ borderRadius: 1 }}>
          <strong>You saved €{savings.toFixed(2)}</strong> this period
        </Alert>
      </Grid>
      <Grid size={6}>
        <FormControl fullWidth>
          <InputLabel>House</InputLabel>
          <Select
            value={selectedHouse}
            onChange={(e) => {
              setSelectedHouse(e.target.value);
              setSelectedUnit("all");
            }}
          >
            {MOCK_HOUSES.map((h) => (
              <MenuItem key={h.id} value={h.id}>
                {h.address}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={6}>
        <FormControl fullWidth>
          <InputLabel>Unit</InputLabel>
          <Select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <MenuItem value="all">All Units</MenuItem>
            {house.units.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={12}>
        <Alert severity="success" sx={{ borderRadius: 1 }} variant="filled">
          <strong>You saved €{savings.toFixed(2)}</strong> this period across{" "}
          {house.address}. Keep the sun working.
        </Alert>
      </Grid>
      <Grid size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Consumption</Typography>
            <Typography variant="h4">
              {sumConsumption.toFixed(2)} kWh
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">PV Generation</Typography>
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

      <Grid size={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Consumption vs PV
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <LineChart
                xAxis={[{ data: timestamps }]}
                series={[
                  {
                    data: house.generalConsumptionLog.map((d) => d.kWh),
                    label: "General",
                  },
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
      <Grid size={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Unit Breakdown
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <BarChart
                xAxis={[{ data: timestamps }]}
                series={unitsToShow.map((u) => ({
                  data: u.consumptionLog.map((d) => d.kWh),
                  label: u.name,
                }))}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
