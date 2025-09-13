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
  onDelete,
}: {
  providers: Provider[];
  onEdit: (p: Provider) => void;
  onDelete: (p: Provider) => void;
}) {
  const sumPct = (p: Provider) =>
    p.nuclearEnergyPct +
    p.coalEnergyPct +
    p.gasEnergyPct +
    p.miscFossilEnergyPct +
    p.solarEnergyPct +
    p.windEnergyPct +
    p.miscRenewableEnergyPct;

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Mix (key sources)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {providers.map((p) => {
              const total = sumPct(p);
              const invalid = Math.abs(total - 100) > 0.01;

              return (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography>{p.name}</Typography>
                      {invalid && (
                        <Chip
                          size="small"
                          color="warning"
                          label={`Total ${total.toFixed(0)}%`}
                        />
                      )}
                    </Stack>
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
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Button size="small" onClick={() => onEdit(p)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => onDelete(p)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
