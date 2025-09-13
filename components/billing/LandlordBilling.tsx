// app/billing/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
} from "@mui/material";
import { MOCK_HOUSES } from "../../app/dashboard/page";


export default function LandlordBilling() {
  // добавляем houseId / unitId, чтобы линкнуть форму инвойса
  const rows = MOCK_HOUSES.flatMap((h) =>
    h.units.flatMap((u) =>
      u.bills.map((b) => ({
        houseId: h.id,
        unitId: u.id,
        house: h.address,
        unit: u.name,
        tenant: u.tenant.name,
        month: b.month,
        amount: b.amount,
        status: b.status,
      }))
    )
  );

  const total = rows.reduce((a, r) => a + r.amount, 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Billing Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Total across houses: € {total}
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>House</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Month</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={`${r.house}-${r.unit}-${r.month}-${idx}`}>
                <TableCell>{r.house}</TableCell>
                <TableCell>{r.unit}</TableCell>
                <TableCell>{r.tenant}</TableCell>
                <TableCell>{r.month}</TableCell>
                <TableCell align="right">€ {r.amount}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell align="right">
                  <Button
                    component={Link}
                    href={`/billing/new?houseId=${encodeURIComponent(
                      r.houseId
                    )}&unitId=${encodeURIComponent(r.unitId)}`}
                    size="small"
                    variant="contained"
                  >
                    Сгенерировать инвойс
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
