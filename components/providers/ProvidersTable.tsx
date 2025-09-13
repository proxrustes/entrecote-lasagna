// components/providers/ProvidersTable.tsx
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
  Tooltip,
  IconButton,
  Chip,
  Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import { Provider } from "../../types/Provider";

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
              <TableCell>Contract</TableCell>
              <TableCell>Tariff (€/kWh)</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Mix (key sources)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {providers.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>{p.contractId}</Typography>
                    <Tooltip title="Copy contract">
                      <IconButton
                        size="small"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(p.contractId);
                          } catch {}
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {p.startDate}{" "}
                    {p.endDate ? `→ ${p.endDate}` : "(open-ended)"}
                  </Typography>
                </TableCell>
                <TableCell>€ {p.tariffEurPerKwh.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={p.active ? "Active" : "Inactive"}
                    color={p.active ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={`Wind ${p.energyMix.wind}%`} />
                    <Chip size="small" label={`Solar ${p.energyMix.solar}%`} />
                    {p.energyMix.hydro > 0 && (
                      <Chip
                        size="small"
                        label={`Hydro ${p.energyMix.hydro}%`}
                      />
                    )}
                    {p.energyMix.gas > 0 && (
                      <Chip size="small" label={`Gas ${p.energyMix.gas}%`} />
                    )}
                    {p.energyMix.coal > 0 && (
                      <Chip size="small" label={`Coal ${p.energyMix.coal}%`} />
                    )}
                    {p.energyMix.nuclear > 0 && (
                      <Chip
                        size="small"
                        label={`Nuclear ${p.energyMix.nuclear}%`}
                      />
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => onEdit(p)}
                  >
                    Edit
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
