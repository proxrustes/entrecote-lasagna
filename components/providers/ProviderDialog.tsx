"use client";
import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  TextField,
  Button,
  Typography,
  Divider,
} from "@mui/material";
import { MixPie } from "./MixPie";
import { Provider } from "../../types/Provider";

type FormState = Omit<Provider, "id" | "createdAt" | "updatedAt">;

const emptyForm = (): FormState => ({
  providerId: "",
  name: "",
  nuclearEnergyPct: 0,
  coalEnergyPct: 0,
  gasEnergyPct: 0,
  miscFossilEnergyPct: 0,
  solarEnergyPct: 0,
  windEnergyPct: 0,
  miscRenewableEnergyPct: 0,
});

export function ProviderDialog({
  open,
  onClose,
  initial,
  onCreate,
  onSaveLocal,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Provider | null;
  onCreate: (payload: FormState) => Promise<void>;
  onSaveLocal?: (p: Provider) => void;
}) {
  const [form, setForm] = React.useState<FormState>(
    initial
      ? {
          providerId: initial.providerId,
          name: initial.name,
          nuclearEnergyPct: initial.nuclearEnergyPct,
          coalEnergyPct: initial.coalEnergyPct,
          gasEnergyPct: initial.gasEnergyPct,
          miscFossilEnergyPct: initial.miscFossilEnergyPct,
          solarEnergyPct: initial.solarEnergyPct,
          windEnergyPct: initial.windEnergyPct,
          miscRenewableEnergyPct: initial.miscRenewableEnergyPct,
        }
      : emptyForm()
  );

  React.useEffect(() => {
    if (initial) {
      setForm({
        providerId: initial.providerId,
        name: initial.name,
        nuclearEnergyPct: initial.nuclearEnergyPct,
        coalEnergyPct: initial.coalEnergyPct,
        gasEnergyPct: initial.gasEnergyPct,
        miscFossilEnergyPct: initial.miscFossilEnergyPct,
        solarEnergyPct: initial.solarEnergyPct,
        windEnergyPct: initial.windEnergyPct,
        miscRenewableEnergyPct: initial.miscRenewableEnergyPct,
      });
    } else {
      setForm(emptyForm());
    }
  }, [initial, open]);

  const total =
    form.nuclearEnergyPct +
    form.coalEnergyPct +
    form.gasEnergyPct +
    form.miscFossilEnergyPct +
    form.solarEnergyPct +
    form.windEnergyPct +
    form.miscRenewableEnergyPct;

  const invalid =
    Math.abs(total - 100) > 0.01 || !form.providerId || !form.name;

  const num = (k: keyof FormState) => ({
    value: form[k] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: Number(e.target.value) })),
    type: "number" as const,
    inputProps: { min: 0, max: 100, step: "1" },
    fullWidth: true,
  });

  const submit = async () => {
    if (initial) {
      onSaveLocal?.({ id: initial.id, ...form });
      onClose();
      return;
    }
    await onCreate(form);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initial ? "Edit Provider" : "Add Provider"}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={4}>
          <Grid size={7}>
            <Stack spacing={4}>
              <Stack spacing={2}>
                <TextField
                  label="Contract number"
                  size="small"
                  value={form.providerId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, providerId: e.target.value }))
                  }
                  fullWidth
                  disabled={!!initial}
                />
                <TextField
                  size="small"
                  label="Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  fullWidth
                />
              </Stack>
              <Divider />
              <Typography variant="subtitle1">
                Energy sources (%) — must sum to 100
              </Typography>
              <Grid container spacing={1}>
                <Grid size={4}>
                  <TextField label="Nuclear" {...num("nuclearEnergyPct")} />
                </Grid>
                <Grid size={4}>
                  <TextField label="Coal" {...num("coalEnergyPct")} />
                </Grid>
                <Grid size={4}>
                  <TextField label="Gas" {...num("gasEnergyPct")} />
                </Grid>
                <Grid size={4}>
                  <TextField label="Wind" {...num("windEnergyPct")} />
                </Grid>
                <Grid size={4}>
                  <TextField label="Solar" {...num("solarEnergyPct")} />
                </Grid>
                <Grid size={4}>
                  <TextField
                    label="Misc Fossil"
                    {...num("miscFossilEnergyPct")}
                  />
                </Grid>
                <Grid size={4}>
                  <TextField
                    label="Misc Renewable"
                    {...num("miscRenewableEnergyPct")}
                  />
                </Grid>
              </Grid>
              <Typography color={invalid ? "error" : "text.secondary"}>
                Total: {total.toFixed(0)}%
              </Typography>
            </Stack>
          </Grid>

          <Grid size={5}>
            <Typography variant="subtitle1" gutterBottom>
              Source preview
            </Typography>
            <MixPie p={form} height={220} />
            <Typography variant="caption" color="text.secondary">
              Live preview updates as you edit percentages.
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={invalid} variant="contained">
          {initial ? "Save (local)" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
