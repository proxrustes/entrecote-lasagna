import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack,
  Box,
  Alert,
  Button,
  Grid,
  Divider
} from "@mui/material";
import { useSession } from "next-auth/react";
import HomeIcon from "@mui/icons-material/Home";
import DownloadIcon from "@mui/icons-material/Download";
import EuroIcon from "@mui/icons-material/Euro";
import { CardHeader } from "../dashboard/CardHeader";
import { useTenantCosts } from "../../services/costs/costs.hooks";
import { isMoney } from "../../services/costs/costs.service";
import { useState, useMemo } from "react";

export function TenantBilling() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | '3months' | '6months' | '1year'>('current');

  const periodConfig = {
    current: { startDate: undefined, endDate: undefined, label: 'Current Month' },
    '3months': {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      label: 'Last 3 Months'
    },
    '6months': {
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      label: 'Last 6 Months'
    },
    '1year': {
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      label: 'Last Year'
    }
  };

  const { data: costsData, isLoading, error } = useTenantCosts(
    userId ? {
      userId,
      ...periodConfig[selectedPeriod]
    } : undefined
  );

  const costDataMoney = costsData && isMoney(costsData) ? costsData : null;

  const monthlyBills = useMemo(() => {
    if (!costDataMoney) return [];

    // Generate mock monthly breakdown based on period
    const now = new Date();
    const bills = [];

    if (selectedPeriod === 'current') {
      bills.push({
        month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        amount: costDataMoney.totalCost + costDataMoney.baseFee,
        status: 'Current',
        pvCost: costDataMoney.pvCost,
        gridCost: costDataMoney.gridCost,
        baseFee: costDataMoney.baseFee
      });
    } else {
      const monthsBack = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12;
      const avgMonthly = (costDataMoney.totalCost + costDataMoney.baseFee) / monthsBack;

      for (let i = 0; i < monthsBack; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        bills.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          amount: avgMonthly + (Math.random() - 0.5) * 10, // Add some variation
          status: i === 0 ? 'Current' : 'Paid',
          pvCost: costDataMoney.pvCost / monthsBack,
          gridCost: costDataMoney.gridCost / monthsBack,
          baseFee: costDataMoney.baseFee / monthsBack
        });
      }
    }

    return bills;
  }, [costDataMoney, selectedPeriod]);

  const handleExport = () => {
    if (!monthlyBills.length) return;

    const csvContent = [
      ['Month', 'Total Amount (€)', 'Solar Cost (€)', 'Grid Cost (€)', 'Base Fee (€)', 'Status'],
      ...monthlyBills.map(bill => [
        bill.month,
        bill.amount.toFixed(2),
        bill.pvCost.toFixed(2),
        bill.gridCost.toFixed(2),
        bill.baseFee.toFixed(2),
        bill.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy-bills-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <HomeIcon sx={{ fontSize: 42, color: 'text.secondary' }} />
            <Typography variant="h6">Loading Billing Data...</Typography>
            <LinearProgress sx={{ width: '100%' }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load billing data. Please try again later.
      </Alert>
    );
  }

  if (!costDataMoney) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <HomeIcon sx={{ fontSize: 42, color: 'text.secondary' }} />
            <Typography variant="h6">No Billing Data Available</Typography>
            <Typography color="text.secondary">Please check back later.</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const currentBill = monthlyBills[0];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Current Bill Summary */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <CardHeader
                address={(session?.user as any)?.address || "Loading..."}
                name={session?.user?.name || "Loading..."}
                contractNumber={(session?.user as any)?.contractId || "N/A"}
              />

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h4" color="primary">
                    €{currentBill?.amount.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current month total
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" color="text.secondary">
                    Period: {costDataMoney.timeRange.start.slice(0, 10)} to {costDataMoney.timeRange.end.slice(0, 10)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Breakdown Cards */}
        <Grid size={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <EuroIcon color="success" />
                <Typography variant="h6" color="success.main">Solar Energy</Typography>
              </Stack>
              <Typography variant="h4">€{costDataMoney.pvCost.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {costDataMoney.breakdown.pvConsumption.toFixed(1)} kWh @ €{costDataMoney.breakdown.pvRate.toFixed(3)}/kWh
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <EuroIcon color="warning" />
                <Typography variant="h6" color="warning.main">Grid Energy</Typography>
              </Stack>
              <Typography variant="h4">€{costDataMoney.gridCost.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {costDataMoney.breakdown.gridConsumption.toFixed(1)} kWh @ €{costDataMoney.breakdown.gridRate.toFixed(3)}/kWh
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <EuroIcon color="info" />
                <Typography variant="h6" color="info.main">Base Fee</Typography>
              </Stack>
              <Typography variant="h4">€{costDataMoney.baseFee.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Monthly service charge
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Period Selection and Export */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Billing History</Typography>
                <Stack direction="row" spacing={2}>
                  <Stack direction="row" spacing={1}>
                    {Object.entries(periodConfig).map(([key, config]) => (
                      <Button
                        key={key}
                        variant={selectedPeriod === key ? "contained" : "outlined"}
                        size="small"
                        onClick={() => setSelectedPeriod(key as any)}
                      >
                        {config.label}
                      </Button>
                    ))}
                  </Stack>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    size="small"
                  >
                    Export CSV
                  </Button>
                </Stack>
              </Stack>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Solar</TableCell>
                    <TableCell align="right">Grid</TableCell>
                    <TableCell align="right">Base Fee</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyBills.map((bill, i) => (
                    <TableRow key={`${bill.month}-${i}`}>
                      <TableCell>{bill.month}</TableCell>
                      <TableCell align="right">€{bill.pvCost.toFixed(2)}</TableCell>
                      <TableCell align="right">€{bill.gridCost.toFixed(2)}</TableCell>
                      <TableCell align="right">€{bill.baseFee.toFixed(2)}</TableCell>
                      <TableCell align="right"><strong>€{bill.amount.toFixed(2)}</strong></TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={bill.status}
                          color={bill.status === "Paid" ? "success" : bill.status === "Current" ? "primary" : "warning"}
                          variant={bill.status === "Paid" ? "filled" : "outlined"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
