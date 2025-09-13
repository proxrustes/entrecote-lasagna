// === app/dashboard/page.tsx ===
"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

// Моковые данные: landlord -> дома -> квартиры + логи
const MOCK_HOUSES = [
  {
    id: "house-1",
    address: "123 Green St",
    units: [
      {
        id: "unit-1",
        name: "WE1",
        consumptionLog: [
          { timestamp: "15:00", kWh: 0.026 },
          { timestamp: "15:15", kWh: 0.027 },
        ],
        meterLog: [
          { timestamp: "15:00", value: 22.457 },
          { timestamp: "15:15", value: 22.483 },
        ],
      },
      {
        id: "unit-2",
        name: "WE2",
        consumptionLog: [
          { timestamp: "15:00", kWh: 0.0 },
          { timestamp: "15:15", kWh: 0.0 },
        ],
        meterLog: [
          { timestamp: "15:00", value: 2.57 },
          { timestamp: "15:15", value: 2.57 },
        ],
      },
    ],
    generalConsumptionLog: [
      { timestamp: "15:00", kWh: 0.017 },
      { timestamp: "15:15", kWh: 0.016 },
    ],
    pvGenerationLog: [
      { timestamp: "15:00", kWh: 0.4273 },
      { timestamp: "15:15", kWh: 0.8492 },
    ],
    gridLog: [
      { timestamp: "15:00", import: 0, export: 0.3843 },
      { timestamp: "15:15", import: 0, export: 0.8062 },
    ],
  },
  {
    id: "house-2",
    address: "45 Solar Ave",
    units: [
      {
        id: "unit-1",
        name: "WE1",
        consumptionLog: [
          { timestamp: "15:00", kWh: 0.012 },
          { timestamp: "15:15", kWh: 0.018 },
        ],
        meterLog: [
          { timestamp: "15:00", value: 11.5 },
          { timestamp: "15:15", value: 11.6 },
        ],
      },
    ],
    generalConsumptionLog: [
      { timestamp: "15:00", kWh: 0.01 },
      { timestamp: "15:15", kWh: 0.015 },
    ],
    pvGenerationLog: [
      { timestamp: "15:00", kWh: 0.3 },
      { timestamp: "15:15", kWh: 0.7 },
    ],
    gridLog: [
      { timestamp: "15:00", import: 0, export: 0.2 },
      { timestamp: "15:15", import: 0, export: 0.5 },
    ],
  },
];

export default function DashboardPage() {
  const [selectedHouse, setSelectedHouse] = React.useState(MOCK_HOUSES[0].id);
  const [selectedUnit, setSelectedUnit] = React.useState("all");

  const house = MOCK_HOUSES.find((h) => h.id === selectedHouse)!;

  // Готовим данные для графиков
  const timestamps = house.pvGenerationLog.map((d) => d.timestamp);
  const sumConsumption =
    house.units
      .map((u) => u.consumptionLog)
      .flat()
      .reduce((acc, d) => acc + d.kWh, 0) +
    house.generalConsumptionLog.reduce((acc, d) => acc + d.kWh, 0);
  const sumPV = house.pvGenerationLog.reduce((acc, d) => acc + d.kWh, 0);

  const unitsToShow =
    selectedUnit === "all"
      ? house.units
      : house.units.filter((u) => u.id === selectedUnit);

  return (
    <Grid container spacing={3}>
      {/* Filters */}
      <Grid size={6}>
        <FormControl fullWidth>
          <InputLabel>House</InputLabel>
          <Select
            value={selectedHouse}
            onChange={(e) => setSelectedHouse(e.target.value)}
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

      {/* KPI */}
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
            <Typography variant="h6">Self-sufficiency</Typography>
            <Typography variant="h4">
              {((sumPV / sumConsumption) * 100).toFixed(0)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid size={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Consumption vs PV
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <LineChart
                xAxis={[{ data: timestamps, label: "Time" }]}
                series={[
                  {
                    data: house.generalConsumptionLog.map((d) => d.kWh),
                    label: "General Consumption",
                  },
                  {
                    data: house.pvGenerationLog.map((d) => d.kWh),
                    label: "PV Generation",
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
                xAxis={[{ data: timestamps, label: "Time" }]}
                series={unitsToShow.map((u) => ({
                  data: u.consumptionLog.map((d) => d.kWh),
                  label: u.name,
                }))}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Meter table */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Meter Logs
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  {unitsToShow.map((u) => (
                    <TableCell key={u.id}>{u.name}</TableCell>
                  ))}
                  <TableCell>General</TableCell>
                  <TableCell>PV</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {house.generalConsumptionLog.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.timestamp}</TableCell>
                    {unitsToShow.map((u) => (
                      <TableCell key={u.id}>
                        {u.meterLog[idx]?.value ?? "-"}
                      </TableCell>
                    ))}
                    <TableCell>
                      {house.generalConsumptionLog[idx]?.kWh ?? "-"}
                    </TableCell>
                    <TableCell>
                      {house.pvGenerationLog[idx]?.kWh ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
