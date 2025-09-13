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
import type { Provider } from "../../types/Provider";
import { ProviderDialog } from "../../components/providers/ProviderDialog";
import { ProvidersTable } from "../../components/providers/ProvidersTable";
import { MixPie } from "../../components/providers/MixPie";
import { createProdiver, getProviders } from "../../services/providers";

export default function ProvidersPage() {
  const { data: session } = useSession();
  const role = (session as any)?.role ?? "tenant";

  const [rows, setRows] = React.useState<Provider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Provider | null>(null);

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProviders();
        if (!ignore) setRows(data);
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Failed to load providers");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
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

  const agg = rows.length
    ? rows.reduce(
        (acc, p) => ({
          nuclearEnergyPct:
            acc.nuclearEnergyPct + p.nuclearEnergyPct / rows.length,
          coalEnergyPct: acc.coalEnergyPct + p.coalEnergyPct / rows.length,
          gasEnergyPct: acc.gasEnergyPct + p.gasEnergyPct / rows.length,
          miscFossilEnergyPct:
            acc.miscFossilEnergyPct + p.miscFossilEnergyPct / rows.length,
          solarEnergyPct: acc.solarEnergyPct + p.solarEnergyPct / rows.length,
          windEnergyPct: acc.windEnergyPct + p.windEnergyPct / rows.length,
          miscRenewableEnergyPct:
            acc.miscRenewableEnergyPct + p.miscRenewableEnergyPct / rows.length,
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
      )
    : {
        nuclearEnergyPct: 0,
        coalEnergyPct: 0,
        gasEnergyPct: 0,
        miscFossilEnergyPct: 0,
        solarEnergyPct: 0,
        windEnergyPct: 0,
        miscRenewableEnergyPct: 0,
      };

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
        onCreate={async (payload) => {
          const created = await createProdiver(payload);
          setRows((r) => [created, ...r]);
        }}
        onSaveLocal={(p) => {
          setRows((r) => r.map((x) => (x.id === p.id ? { ...x, ...p } : x)));
        }}
      />
    </Stack>
  );
}
