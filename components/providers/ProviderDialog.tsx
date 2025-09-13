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
  Alert,
} from "@mui/material";
import { MixPie } from "./MixPie";
import { Provider } from "../../types/Provider";
import { createProvider, updateProvider } from "@/services/providers";

type FormState = Omit<Provider, "id" | "createdAt" | "updatedAt">;

const emptyForm = (): FormState => ({
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
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Provider | null;
  onSaved: () => Promise<void> | void; // refetch caller state
}) {
  const [form, setForm] = React.useState<FormState>(emptyForm());
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initial) {
      setForm({
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
    setError(null);
  }, [initial, open]);

  const total =
    form.nuclearEnergyPct +
    form.coalEnergyPct +
    form.gasEnergyPct +
    form.miscFossilEnergyPct +
    form.solarEnergyPct +
    form.windEnergyPct +
    form.miscRenewableEnergyPct;

  const invalid = Math.abs(total - 100) > 0.01 || !form.name;

  const num = (k: keyof FormState) => ({
    value: form[k] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: Number(e.target.value) })),
    type: "number" as const,
    inputProps: { min: 0, max: 100, step: "1" },
    fullWidth: true,
  });

  const submit = async () => {
    if (invalid || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        // UPDATE
        await updateProvider(initial.id, {
          name: form.name,
          nuclearEnergyPct: form.nuclearEnergyPct,
          coalEnergyPct: form.coalEnergyPct,
          gasEnergyPct: form.gasEnergyPct,
          miscFossilEnergyPct: form.miscFossilEnergyPct,
          solarEnergyPct: form.solarEnergyPct,
          windEnergyPct: form.windEnergyPct,
          miscRenewableEnergyPct: form.miscRenewableEnergyPct,
        });
      } else {
        // CREATE
        await createProvider(form);
      }
      await onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initial ? "Edit Provider" : "Add Provider"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <Grid container spacing={4}>
            <Grid size={7}>
              <Stack spacing={4}>
                <Stack spacing={2}>
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
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={invalid || saving}
          variant="contained"
        >
          {initial ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
