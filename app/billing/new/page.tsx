// app/invoices/new/page.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  Grid,
} from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import { MixPie } from "../../../components/providers/MixPie";
import { INITIAL_PROVIDERS } from "../../providers/page";
import { Provider } from "../../../types/Provider";
import { MOCK_HOUSES } from "../../../lib/mockData";

const HOUSE_PROVIDER_MAP: Record<string, string> = {
  "house-1": "p1",
  "house-2": "p2",
};

function sumKwh(arr: { kWh: number }[]) {
  return arr.reduce((a, d) => a + (Number.isFinite(d.kWh) ? d.kWh : 0), 0);
}

export default function NewInvoicePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const houseIdQ = sp.get("houseId") ?? MOCK_HOUSES[0].id;
  const unitIdQ =
    sp.get("unitId") ??
    MOCK_HOUSES.find((h) => h.id === houseIdQ)?.units[0].id ??
    MOCK_HOUSES[0].units[0].id;

  const house = React.useMemo(
    () => MOCK_HOUSES.find((h) => h.id === houseIdQ) ?? MOCK_HOUSES[0],
    [houseIdQ]
  );
  const unit = React.useMemo(
    () => house.units.find((u) => u.id === unitIdQ) ?? house.units[0],
    [house, unitIdQ]
  );

  // провайдер по дому (простая мапа моков) + возможность выбрать вручную
  const defaultProvider =
    INITIAL_PROVIDERS.find((p) => p.id === HOUSE_PROVIDER_MAP[house.id]) ??
    INITIAL_PROVIDERS[0];
  const [providerId, setProviderId] = React.useState<string>(
    defaultProvider.id
  );
  const provider: Provider =
    INITIAL_PROVIDERS.find((p) => p.id === providerId) ?? defaultProvider;

  // Префилл значений формы
  const defaultUsage = Number(sumKwh(unit.consumptionLog).toFixed(3)); // kWh за период моков
  const [invoiceNo, setInvoiceNo] = React.useState(
    `INV-${new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "")}-${unit.id.toUpperCase()}`
  );
  const [issueDate, setIssueDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = React.useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10)
  );
  const [usageKwh, setUsageKwh] = React.useState<number>(defaultUsage);
  const [unitPrice, setUnitPrice] = React.useState<number>(
    provider.tariffEurPerKwh
  );
  const [vatPct, setVatPct] = React.useState<number>(19);

  const subtotal = +(usageKwh * unitPrice).toFixed(2);
  const vatAmt = +((subtotal * vatPct) / 100).toFixed(2);
  const total = +(subtotal + vatAmt).toFixed(2);

  const onProviderChange = (id: string) => {
    setProviderId(id);
    const p = INITIAL_PROVIDERS.find((x) => x.id === id);
    if (p) setUnitPrice(p.tariffEurPerKwh);
  };

  const handleGenerate = () => {
    // тут подключишь PDF/принт или API
    // пока просто редирект обратно в биллинг
    // и лог для дебага
    // eslint-disable-next-line no-console
    console.log({
      invoiceNo,
      issueDate,
      dueDate,
      tenant: unit.tenant,
      house: { id: house.id, address: house.address },
      unit: { id: unit.id, name: unit.name },
      provider: {
        id: provider.id,
        name: provider.name,
        contractId: provider.contractId,
        tariff: provider.tariffEurPerKwh,
        energyMix: provider.energyMix,
      },
      usageKwh,
      unitPrice,
      vatPct,
      subtotal,
      vatAmt,
      total,
    });
    router.push("/billing");
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={800}>
        Generate Invoice
      </Typography>

      {/* Tenant & Contract */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Tenant & Contract
          </Typography>
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                label="Tenant name"
                value={unit.tenant.name}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Tenant email"
                value={unit.tenant.email}
                fullWidth
              />
            </Grid>
            <Grid size={8}>
              <TextField label="Address" value={house.address} fullWidth />
            </Grid>
            <Grid size={4}>
              <TextField label="Unit" value={unit.name} fullWidth />
            </Grid>

            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={providerId}
                  label="Provider"
                  onChange={(e) => onProviderChange(e.target.value as string)}
                >
                  {INITIAL_PROVIDERS.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <TextField
                label="Contract ID"
                value={provider.contractId}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Provider email"
                value={provider.contact.email ?? ""}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Provider phone"
                value={provider.contact.phone ?? ""}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Energy mix preview */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Provider Energy Mix
          </Typography>
          <MixPie mix={provider.energyMix} />
        </CardContent>
      </Card>

      {/* Invoice details */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Invoice Details
          </Typography>
          <Grid container spacing={2}>
            <Grid size={4}>
              <TextField
                label="Invoice #"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <TextField
                type="date"
                label="Issue date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                type="date"
                label="Due date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={4}>
              <TextField
                type="number"
                label="Usage (kWh)"
                value={usageKwh}
                onChange={(e) => setUsageKwh(Number(e.target.value))}
                fullWidth
                inputProps={{ step: "0.001", min: 0 }}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                type="number"
                label="Unit price (€/kWh)"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                fullWidth
                inputProps={{ step: "0.01", min: 0 }}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                type="number"
                label="VAT (%)"
                value={vatPct}
                onChange={(e) => setVatPct(Number(e.target.value))}
                fullWidth
                inputProps={{ step: "1", min: 0 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid size={4}>
              <TextField label="Subtotal (€)" value={subtotal} fullWidth />
            </Grid>
            <Grid size={4}>
              <TextField label="VAT (€)" value={vatAmt} fullWidth />
            </Grid>
            <Grid size={4}>
              <TextField label="Total (€)" value={total} fullWidth />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" mt={3} spacing={2}>
            <Button variant="outlined" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleGenerate}>
              Generate Invoice
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
