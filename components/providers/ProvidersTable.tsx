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
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  WbSunny,
  Air,
  Bolt,
  LocalFireDepartment,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
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

  const getEnergySourceColor = (source: string) => {
    switch (source) {
      case 'Solar': return '#22c55e';
      case 'Wind': return '#06b6d4';
      case 'Nuclear': return '#f59e0b';
      case 'Coal': return '#ef4444';
      case 'Gas': return '#f97316';
      case 'Fossil': return '#dc2626';
      case 'Renew*': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getEnergySourceIcon = (source: string) => {
    switch (source) {
      case 'Solar': return <WbSunny sx={{ fontSize: 14 }} />;
      case 'Wind': return <Air sx={{ fontSize: 14 }} />;
      case 'Nuclear': return <Bolt sx={{ fontSize: 14 }} />;
      case 'Coal':
      case 'Gas':
      case 'Fossil': return <LocalFireDepartment sx={{ fontSize: 14 }} />;
      default: return null;
    }
  };

  return (
    <Card sx={{
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      <CardContent sx={{ p: 0 }}>
        <Table sx={{ '& .MuiTableCell-root': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Provider</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Energy Mix</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {providers.map((p) => {
              const total = sumPct(p);
              const invalid = Math.abs(total - 100) > 0.01;

              return (
                <TableRow key={p.id} hover sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                    cursor: 'pointer',
                  },
                  transition: 'background-color 0.2s ease',
                }}>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Stack>
                        <Typography variant="body1" fontWeight="medium">
                          {p.name}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                          {invalid ? (
                            <>
                              <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                              <Typography variant="caption" color="warning.main" fontWeight="medium">
                                Total: {total.toFixed(0)}%
                              </Typography>
                            </>
                          ) : (
                            <>
                              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                              <Typography variant="caption" color="success.main">
                                Valid mix
                              </Typography>
                            </>
                          )}
                        </Stack>
                      </Stack>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ maxWidth: 400 }}>
                      {[
                        { label: 'Solar', value: p.solarEnergyPct },
                        { label: 'Wind', value: p.windEnergyPct },
                        { label: 'Nuclear', value: p.nuclearEnergyPct },
                        { label: 'Coal', value: p.coalEnergyPct },
                        { label: 'Gas', value: p.gasEnergyPct },
                        { label: 'Fossil', value: p.miscFossilEnergyPct },
                        { label: 'Renew*', value: p.miscRenewableEnergyPct },
                      ].filter(item => item.value > 0).map((item) => (
                        <Chip
                          key={item.label}
                          size="small"
                          {...(getEnergySourceIcon(item.label) && { icon: getEnergySourceIcon(item.label)! })}
                          label={`${item.value}%`}
                          sx={{
                            bgcolor: `${getEnergySourceColor(item.label)}15`,
                            color: getEnergySourceColor(item.label),
                            fontWeight: 'medium',
                            '& .MuiChip-icon': {
                              color: getEnergySourceColor(item.label),
                            },
                            border: `1px solid ${getEnergySourceColor(item.label)}30`,
                          }}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit provider">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(p)}
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              bgcolor: 'primary.50',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete provider">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(p)}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              bgcolor: 'error.50',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
