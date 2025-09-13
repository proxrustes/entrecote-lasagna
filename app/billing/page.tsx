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
} from "@mui/material";

const MOCK_BILLS = [
  { month: "August", amount: "€120", status: "Paid" },
  { month: "September", amount: "€135", status: "Pending" },
];

export default function BillingPage() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Billing History</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_BILLS.map((row) => (
              <TableRow key={row.month}>
                <TableCell>{row.month}</TableCell>
                <TableCell>{row.amount}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
