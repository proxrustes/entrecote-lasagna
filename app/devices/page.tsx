// === app/dashboard/page.tsx ===
"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

const MOCK_BUILDINGS = [
  {
    address: "123 Green St",
    usage: "1240 kWh",
    solar: 40,
    revenue: "€ 1200",
    payments: "90% paid",
  },
  {
    address: "45 Solar Ave",
    usage: "980 kWh",
    solar: 65,
    revenue: "€ 950",
    payments: "75% paid",
  },
  {
    address: "9 Battery Rd",
    usage: "1500 kWh",
    solar: 25,
    revenue: "€ 1420",
    payments: "60% paid",
  },
];

export default function DashboardPage() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Buildings Overview
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Address</TableCell>
              <TableCell align="right">Total Usage</TableCell>
              <TableCell align="right">Solar Coverage</TableCell>
              <TableCell align="right">Revenue</TableCell>
              <TableCell align="right">Payments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_BUILDINGS.map((b) => (
              <TableRow key={b.address}>
                <TableCell>{b.address}</TableCell>
                <TableCell align="right">{b.usage}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${b.solar}%`}
                    color={
                      b.solar > 50
                        ? "success"
                        : b.solar > 30
                        ? "warning"
                        : "default"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{b.revenue}</TableCell>
                <TableCell align="right">{b.payments}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
