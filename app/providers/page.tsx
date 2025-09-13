"use client";
import * as React from "react";
import {
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useSession } from "next-auth/react";
import type { Provider } from "@/types/Provider";
import { getProviders, deleteProvider } from "@/services/providers";
import { ProviderDialog } from "@/components/providers/ProviderDialog";
import { ProvidersTable } from "@/components/providers/ProvidersTable";
import { MixPie } from "@/components/providers/MixPie";

export default function ProvidersPage() {
  const { data: session } = useSession();
  const role = (session as any)?.role ?? "tenant";

  const [rows, setRows] = React.useState<Provider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Provider | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProviders();
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      if (ignore) return;
      await load();
    })();
    return () => {
      ignore = true;
    };
  }, [load]);

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

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  // simple average mix
  const n = rows.length || 1;
  const agg = rows.reduce(
    (acc, p) => ({
      nuclearEnergyPct: acc.nuclearEnergyPct + p.nuclearEnergyPct / n,
      coalEnergyPct: acc.coalEnergyPct + p.coalEnergyPct / n,
      gasEnergyPct: acc.gasEnergyPct + p.gasEnergyPct / n,
      miscFossilEnergyPct: acc.miscFossilEnergyPct + p.miscFossilEnergyPct / n,
      solarEnergyPct: acc.solarEnergyPct + p.solarEnergyPct / n,
      windEnergyPct: acc.windEnergyPct + p.windEnergyPct / n,
      miscRenewableEnergyPct:
        acc.miscRenewableEnergyPct + p.miscRenewableEnergyPct / n,
    }),
    {
      nuclearEnergyPct: 0,
      coalEnergyPct: 0,
      gasEnergyPct: 0,
      miscFossilEnergyPct: 0,
      solarEnergyPct: 0,
      windEnergyPct: 0,
      miscRenewableEnergyPct: 0,
    }
  );

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
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Add provider
          </Button>
        </Stack>

        <ProvidersTable
          providers={rows}
          onEdit={(p) => {
            setEditing(p);
            setOpen(true);
          }}
          onDelete={async (p) => {
            if (!confirm(`Delete provider "${p.name}"?`)) return;
            try {
              await deleteProvider(p.id);
              await load(); // рефетч после удаления
            } catch (e: any) {
              alert(e?.message || "Delete failed");
            }
          }}
        />
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">Aggregate energy mix (DB)</Typography>
        <Card>
          <CardContent>
            <MixPie p={agg} />
          </CardContent>
        </Card>
      </Stack>

      <ProviderDialog
        open={open}
        initial={editing}
        onClose={() => setOpen(false)}
        onSaved={async () => {
          await load();
          setOpen(false);
        }}
      />
    </Stack>
  );
}
