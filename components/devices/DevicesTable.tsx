"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import type { DeviceRow } from "./types";

const fmtKWh = (v: number) =>
  `${v.toLocaleString("en-GB", { maximumFractionDigits: 2 })} kWh`;
const fmtTS = (iso: string) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const statusChip = (s: DeviceRow["status"]) => {
  switch (s) {
    case "online":
      return <Chip size="small" label="Online" color="success" />;
    case "degraded":
      return <Chip size="small" label="Degraded" color="warning" />;
    default:
      return <Chip size="small" label="Offline" />;
  }
};

export function DevicesTable({ rows }: { rows: DeviceRow[] }) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Device</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last reading</TableCell>
              <TableCell align="right">kWh produced (today)</TableCell>
              <TableCell align="right">kWh produced (total)</TableCell>{" "}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.address}</TableCell>
                <TableCell>{statusChip(d.status)}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">
                      {fmtTS(d.lastReadingAt)}
                    </Typography>
                    {typeof d.lastReadingValue === "number" && (
                      <Tooltip title="Last meter value">
                        <Typography variant="caption" color="text.secondary">
                          · {d.lastReadingValue.toLocaleString("en-GB")}
                        </Typography>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  {fmtKWh(d.kwhProducedToday)}
                </TableCell>
                <TableCell align="right">
                  {fmtKWh(d.kwhProducedTotal)}
                </TableCell>{" "}
                {/* << NEW */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
