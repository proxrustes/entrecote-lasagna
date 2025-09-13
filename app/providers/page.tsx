"use client";
import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { PieChart } from "@mui/x-charts/PieChart";
import { useSession } from "next-auth/react";

// Provider types & mocks
export type EnergyMix = {
  coal: number;
  gas: number;
  wind: number;
  hydro: number;
  solar: number;
  nuclear: number;
  other: number;
};

export type Provider = {
  id: string;
  name: string;
  contractId: string;
  startDate: string; // ISO
  endDate?: string; // ISO
  tariffEurPerKwh: number;
  energyMix: EnergyMix;
  contact: { email?: string; phone?: string; website?: string };
  active: boolean;
};

const INITIAL_PROVIDERS: Provider[] = [
  {
    id: "p1",
    name: "Vattenfall",
    contractId: "VF-2025-0001",
    startDate: "2025-01-01",
    tariffEurPerKwh: 0.29,
    energyMix: {
      coal: 10,
      gas: 15,
      wind: 35,
      hydro: 10,
      solar: 20,
      nuclear: 5,
      other: 5,
    },
    contact: { email: "support@vattenfall.com", phone: "+49 30 123456" },
    active: true,
  },
  {
    id: "p2",
    name: "Octopus Energy",
    contractId: "OCTO-2025-117",
    startDate: "2025-03-01",
    tariffEurPerKwh: 0.27,
    energyMix: {
      coal: 0,
      gas: 10,
      wind: 40,
      hydro: 20,
      solar: 25,
      nuclear: 0,
      other: 5,
    },
    contact: { email: "help@octopus.energy" },
    active: true,
  },
];

function mixTotal(m: EnergyMix) {
  return m.coal + m.gas + m.wind + m.hydro + m.solar + m.nuclear + m.other;
}

function MixPie({ mix }: { mix: EnergyMix }) {
  const data = [
    { id: "Coal", label: "Coal", value: mix.coal },
    { id: "Gas", label: "Gas", value: mix.gas },
    { id: "Wind", label: "Wind", value: mix.wind },
    { id: "Hydro", label: "Hydro", value: mix.hydro },
    { id: "Solar", label: "Solar", value: mix.solar },
    { id: "Nuclear", label: "Nuclear", value: mix.nuclear },
    { id: "Other", label: "Other", value: mix.other },
  ];
  return (
    <PieChart series={[{ data, innerRadius: 40 }]} width={320} height={220} />
  );
}

function ProviderDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (p: Provider) => void;
  initial?: Provider;
}) {
  const [form, setForm] = React.useState<Provider>(
    initial ?? {
      id: crypto.randomUUID(),
      name: "",
      contractId: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: undefined,
      tariffEurPerKwh: 0.28,
      energyMix: {
        coal: 0,
        gas: 0,
        wind: 0,
        hydro: 0,
        solar: 0,
        nuclear: 0,
        other: 0,
      },
      contact: {},
      active: true,
    }
  );

  React.useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const total = mixTotal(form.energyMix);
  const invalid = total !== 100;

  const updateMix = (key: keyof EnergyMix, value: number) => {
    setForm((f) => ({
      ...f,
      energyMix: { ...f.energyMix, [key]: Math.max(0, Math.min(100, value)) },
    }));
  };

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(form.contractId);
    } catch {}
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initial ? "Edit Provider" : "Add Provider"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid size={7}>
            <Stack spacing={2}>
              <TextField
                label="Provider name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                fullWidth
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="Contract ID"
                  value={form.contractId}
                  onChange={(e) =>
                    setForm({ ...form, contractId: e.target.value })
                  }
                  fullWidth
                />
                <Tooltip title="Copy contract">
                  <IconButton onClick={copyContract}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  type="date"
                  label="Start date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="date"
                  label="End date"
                  value={form.endDate ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <TextField
                type="number"
                inputProps={{ step: "0.01" }}
                label="Tariff (€/kWh)"
                value={form.tariffEurPerKwh}
                onChange={(e) =>
                  setForm({ ...form, tariffEurPerKwh: Number(e.target.value) })
                }
                fullWidth
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Email"
                  value={form.contact.email ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact: { ...form.contact, email: e.target.value },
                    })
                  }
                  fullWidth
                />
                <TextField
                  label="Phone"
                  value={form.contact.phone ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contact: { ...form.contact, phone: e.target.value },
                    })
                  }
                  fullWidth
                />
              </Stack>
              <TextField
                label="Website"
                value={form.contact.website ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contact: { ...form.contact, website: e.target.value },
                  })
                }
                fullWidth
              />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Energy mix (%)
                </Typography>
                <Grid container spacing={1}>
                  {(Object.keys(form.energyMix) as (keyof EnergyMix)[]).map(
                    (k) => (
                      <Grid size={4} key={k}>
                        <TextField
                          type="number"
                          label={k.charAt(0).toUpperCase() + k.slice(1)}
                          value={form.energyMix[k]}
                          onChange={(e) => updateMix(k, Number(e.target.value))}
                          InputProps={{ inputProps: { min: 0, max: 100 } }}
                          fullWidth
                        />
                      </Grid>
                    )
                  )}
                </Grid>
                <Typography mt={1} color={invalid ? "error" : "text.secondary"}>
                  Total: {total}% {invalid ? "(must equal 100%)" : ""}
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                  />
                }
                label="Active"
              />
            </Stack>
          </Grid>
          <Grid size={5}>
            <Typography variant="subtitle1" gutterBottom>
              Mix preview
            </Typography>
            <MixPie mix={form.energyMix} />
            <Typography color="text.secondary">
              Live preview updates as you edit percentages.
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onSave(form)}
          variant="contained"
          disabled={invalid}
        >
          {initial ? "Save changes" : "Add provider"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ProvidersPage() {
  const { data: session } = useSession();
  const role = (session as any)?.role ?? "tenant";

  const [providers, setProviders] =
    React.useState<Provider[]>(INITIAL_PROVIDERS);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Provider | undefined>(undefined);

  const handleAdd = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const handleEdit = (p: Provider) => {
    setEditing(p);
    setOpen(true);
  };
  const handleSave = (p: Provider) => {
    setProviders((list) => {
      const idx = list.findIndex((x) => x.id === p.id);
      if (idx === -1) return [p, ...list];
      const copy = [...list];
      copy[idx] = p;
      return copy;
    });
    setOpen(false);
  };

  if (role !== "landlord") {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Providers</Typography>
          <Typography color="text.secondary">
            Only landlords can manage providers.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Energy Providers</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={handleAdd}>
          Add provider
        </Button>
      </Stack>

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
                      <Chip
                        size="small"
                        label={`Solar ${p.energyMix.solar}%`}
                      />
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
                        <Chip
                          size="small"
                          label={`Coal ${p.energyMix.coal}%`}
                        />
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
                      onClick={() => handleEdit(p)}
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

      {/* Aggregate mix across active providers (simple average) */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Aggregate energy mix (active providers)
          </Typography>
          {(() => {
            const active = providers.filter((p) => p.active);
            const agg: EnergyMix = {
              coal: 0,
              gas: 0,
              wind: 0,
              hydro: 0,
              solar: 0,
              nuclear: 0,
              other: 0,
            };
            if (active.length) {
              active.forEach((p) => {
                (Object.keys(agg) as (keyof EnergyMix)[]).forEach((k) => {
                  agg[k] += p.energyMix[k] / active.length;
                });
              });
            }
            return (
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems="center"
                spacing={2}
              >
                <MixPie mix={agg} />
                <Box>
                  <Typography color="text.secondary">
                    Averaged share across all active providers.
                  </Typography>
                </Box>
              </Stack>
            );
          })()}
        </CardContent>
      </Card>

      <ProviderDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        initial={editing}
      />
    </Stack>
  );
}

// === middleware.ts (update matcher & rule so /providers is landlord-only) ===
// NOTE: place this in your root `middleware.ts` file
// import { withAuth } from "next-auth/middleware";
// export default withAuth({
//   callbacks: {
//     authorized: ({ token, req }) => {
//       const path = req.nextUrl.pathname;
//       if (path === "/") return true; // public landing
//       if (!token) return false; // require auth elsewhere
//       const role = token.role;
//       if (path.startsWith("/devices") && role !== "landlord") return false;
//       if (path.startsWith("/providers") && role !== "landlord") return false;
//       return true;
//     },
//   },
// });
// export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
