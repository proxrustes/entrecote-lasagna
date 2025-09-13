"use client";
import * as React from "react";
import { Card, CardContent, Typography, Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useSession } from "next-auth/react";
import { ProviderDialog } from "../../components/providers/ProviderDialog";
import { MixPie } from "../../components/providers/MixPie";
import { ProvidersTable } from "../../components/providers/ProvidersTable";
import { Provider } from "../../types/Provider";
import { EnergyMix } from "../../types/EnergyMix";

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
    <Stack spacing={6}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">Energy Providers</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={handleAdd}
          >
            Add provider
          </Button>
        </Stack>

        <ProvidersTable providers={providers} onEdit={handleEdit} />
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h6">
          Aggregate energy mix (active providers)
        </Typography>
        <Card>
          <CardContent>
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
              return <MixPie mix={agg} />;
            })()}
          </CardContent>
        </Card>
      </Stack>
      <ProviderDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        initial={editing}
      />
    </Stack>
  );
}
