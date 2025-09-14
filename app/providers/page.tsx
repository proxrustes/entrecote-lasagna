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
  Box,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  WbSunny,
  Air,
  Bolt,
  LocalFireDepartment,
  Assessment,
} from "@mui/icons-material";
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

  // Calculate summary statistics
  const totalProviders = rows.length;
  const renewablePercentage = totalProviders > 0 ?
    rows.reduce((sum, p) => sum + p.solarEnergyPct + p.windEnergyPct + p.miscRenewableEnergyPct, 0) / totalProviders : 0;
  const validMixes = rows.filter(p => {
    const total = p.nuclearEnergyPct + p.coalEnergyPct + p.gasEnergyPct +
                  p.miscFossilEnergyPct + p.solarEnergyPct + p.windEnergyPct + p.miscRenewableEnergyPct;
    return Math.abs(total - 100) <= 0.01;
  }).length;

  const dominantSource = totalProviders > 0 ? (() => {
    const totals = {
      renewable: rows.reduce((sum, p) => sum + p.solarEnergyPct + p.windEnergyPct + p.miscRenewableEnergyPct, 0),
      nuclear: rows.reduce((sum, p) => sum + p.nuclearEnergyPct, 0),
      fossil: rows.reduce((sum, p) => sum + p.coalEnergyPct + p.gasEnergyPct + p.miscFossilEnergyPct, 0),
    };
    const max = Math.max(totals.renewable, totals.nuclear, totals.fossil);
    return totals.renewable === max ? 'Renewable' : totals.nuclear === max ? 'Nuclear' : 'Fossil';
  })() : 'N/A';

  return (
    <Stack spacing={3}>
      {/* Summary Statistics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary.main" fontWeight="bold">
            {totalProviders}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Providers
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main" fontWeight="bold">
            {renewablePercentage.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avg Renewable
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4"
            color={validMixes === totalProviders ? 'success.main' : validMixes > totalProviders * 0.5 ? 'warning.main' : 'error.main'}
            fontWeight="bold"
          >
            {validMixes}/{totalProviders}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Valid Mixes
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            {dominantSource === 'Renewable' && <WbSunny sx={{ color: 'success.main' }} />}
            {dominantSource === 'Nuclear' && <Bolt sx={{ color: 'warning.main' }} />}
            {dominantSource === 'Fossil' && <LocalFireDepartment sx={{ color: 'error.main' }} />}
            <Typography variant="h6" fontWeight="bold">
              {dominantSource}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Dominant Source
          </Typography>
        </Paper>
      </Box>

      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Assessment color="primary" />
            <Typography variant="h6">Energy Providers</Typography>
          </Stack>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
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

      <Card sx={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <WbSunny sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold">Aggregate Energy Mix</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                (Average across all providers)
              </Typography>
            </Stack>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <MixPie p={agg} width={300} height={240} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Energy Source Breakdown:
                  </Typography>
                  {[
                    { label: 'Solar', value: agg.solarEnergyPct, color: '#22c55e', icon: <WbSunny sx={{ fontSize: 16 }} /> },
                    { label: 'Wind', value: agg.windEnergyPct, color: '#06b6d4', icon: <Air sx={{ fontSize: 16 }} /> },
                    { label: 'Nuclear', value: agg.nuclearEnergyPct, color: '#f59e0b', icon: <Bolt sx={{ fontSize: 16 }} /> },
                    { label: 'Coal', value: agg.coalEnergyPct, color: '#ef4444', icon: <LocalFireDepartment sx={{ fontSize: 16 }} /> },
                    { label: 'Gas', value: agg.gasEnergyPct, color: '#f97316', icon: <LocalFireDepartment sx={{ fontSize: 16 }} /> },
                    { label: 'Other Renewable', value: agg.miscRenewableEnergyPct, color: '#10b981' },
                    { label: 'Other Fossil', value: agg.miscFossilEnergyPct, color: '#dc2626' },
                  ].filter(item => item.value > 0).map((item, index) => (
                    <Stack key={index} direction="row" alignItems="center" justifyContent="space-between"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {item.icon && <Box sx={{ color: item.color }}>{item.icon}</Box>}
                        <Typography variant="body2" fontWeight="medium">
                          {item.label}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: item.color }}>
                        {item.value.toFixed(1)}%
                      </Typography>
                    </Stack>
                  ))}
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: renewablePercentage >= 50 ? 'success.50' : 'warning.50', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Total renewable: <strong>{renewablePercentage.toFixed(1)}%</strong>
                      {renewablePercentage >= 50 ? ' 🌱 Great!' : ' ⚡ Could be improved'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

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
