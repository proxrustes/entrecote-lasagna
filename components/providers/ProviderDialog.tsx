import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Stack,
  TextField,
  Tooltip,
  IconButton,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  DialogActions,
  Button,
} from "@mui/material";
import React from "react";
import { MixPie } from "./MixPie";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { EnergyMix } from "../../types/EnergyMix";
import { Provider } from "../../types/Provider";

function mixTotal(m: EnergyMix) {
  return m.coal + m.gas + m.wind + m.hydro + m.solar + m.nuclear + m.other;
}

export function ProviderDialog({
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
  const [form, setForm] = useState<Provider>(
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
