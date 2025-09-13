"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import type { Provider } from "../../types/Provider";

export function ProvidersTable({
  providers,
  onEdit,
}: {
  providers: Provider[];
  onEdit: (p: Provider) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Provider ID</TableCell>
              <TableCell>Mix (key sources)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {providers.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: "mono" }}>
                    {p.providerId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={`Wind ${p.windEnergyPct}%`} />
                    <Chip size="small" label={`Solar ${p.solarEnergyPct}%`} />
                    {p.nuclearEnergyPct > 0 && (
                      <Chip
                        size="small"
                        label={`Nuclear ${p.nuclearEnergyPct}%`}
                      />
                    )}
                    {p.coalEnergyPct > 0 && (
                      <Chip size="small" label={`Coal ${p.coalEnergyPct}%`} />
                    )}
                    {p.gasEnergyPct > 0 && (
                      <Chip size="small" label={`Gas ${p.gasEnergyPct}%`} />
                    )}
                    {p.miscFossilEnergyPct > 0 && (
                      <Chip
                        size="small"
                        label={`Fossil ${p.miscFossilEnergyPct}%`}
                      />
                    )}
                    {p.miscRenewableEnergyPct > 0 && (
                      <Chip
                        size="small"
                        label={`Renew* ${p.miscRenewableEnergyPct}%`}
                      />
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => onEdit(p)}>
                    Edit (local)
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
