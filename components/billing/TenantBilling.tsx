import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stack,
  Box,
  Alert,
  Grid,
  Divider,
  Tab,
  Tabs,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Snackbar
} from "@mui/material";
import { useSession } from "next-auth/react";
import HomeIcon from "@mui/icons-material/Home";
import EuroIcon from "@mui/icons-material/Euro";
import DownloadIcon from "@mui/icons-material/Download";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import { CardHeader } from "../dashboard/CardHeader";
import { useTenantCosts } from "../../services/costs/costs.hooks";
import { isMoney } from "../../services/costs/costs.service";
import { useTenantLandlord } from "../../services/tenant/tenant.hooks";
import { useInvoices, useDownloadInvoice } from "../../services/invoices/invoices.hooks";
import * as React from "react";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`billing-tabpanel-${index}`}
      aria-labelledby={`billing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function TenantBilling() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [tabValue, setTabValue] = React.useState(0);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");

  // Get landlordId for tenant user
  const { data: landlordData, isLoading: isLoadingLandlord } = useTenantLandlord(userId);
  const landlordId = landlordData?.landlordId;

  // Current costs data
  const { data: costsData, isLoading: isLoadingCosts, error: costsError } = useTenantCosts(
    userId && landlordId ? { userId, landlordId } : undefined
  );

  // Invoice data
  const { data: invoicesData, isLoading: isLoadingInvoices, error: invoicesError } = useInvoices(userId);

  // Mutations
  const downloadInvoiceMutation = useDownloadInvoice();

  const isLoading = isLoadingLandlord || isLoadingCosts;
  const costDataMoney = costsData && isMoney(costsData) ? costsData : null;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  const handleDownloadInvoice = async (invoiceId: string, filename: string) => {
    try {
      const result = await downloadInvoiceMutation.mutateAsync(invoiceId);

      // Create download link
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbarMessage("Invoice downloaded successfully!");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage("Failed to download invoice. Please try again.");
      setSnackbarOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <ReceiptIcon sx={{ fontSize: 42, color: 'text.secondary' }} />
            <Typography variant="h6">Loading Billing Data...</Typography>
            <LinearProgress sx={{ width: '100%' }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (costsError) {
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
            <ReceiptIcon sx={{ fontSize: 42, color: 'text.secondary' }} />
            <Typography variant="h6">No Billing Data Available</Typography>
            <Typography color="text.secondary">Please check back later.</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <CardHeader
            name={session?.user?.name || "Loading..."}
            contractNumber={(session?.user as any)?.contractId || "N/A"}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="billing tabs">
            <Tab icon={<CalendarTodayIcon />} label="Current Month" />
            <Tab icon={<ReceiptIcon />} label="Invoice History" />
          </Tabs>
        </Box>

        {/* Current Month Tab */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            {/* Current Month Summary */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  €{(costDataMoney.totalCost + costDataMoney.baseFee).toFixed(2)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Total for current month
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="body2" color="text.secondary">
                  Period: {costDataMoney.timeRange.start.slice(0, 10)} to {costDataMoney.timeRange.end.slice(0, 10)}
                </Typography>
              </Box>
            </Stack>

            {/* Cost Breakdown Cards */}
            <Grid container spacing={3}>
              <Grid size={4}>
                <Card sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  color: 'white',
                  height: '100%'
                }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                      <SolarPowerIcon sx={{ fontSize: 32 }} />
                      <Typography variant="h6">Solar Energy</Typography>
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      €{costDataMoney.pvCost.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {costDataMoney.breakdown.pvConsumption.toFixed(1)} kWh @ €{costDataMoney.breakdown.pvRate.toFixed(3)}/kWh
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                      <ElectricBoltIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                      <Typography variant="h6" color="warning.main">Grid Energy</Typography>
                    </Stack>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      €{costDataMoney.gridCost.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {costDataMoney.breakdown.gridConsumption.toFixed(1)} kWh @ €{costDataMoney.breakdown.gridRate.toFixed(3)}/kWh
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                      <EuroIcon sx={{ fontSize: 32, color: 'info.main' }} />
                      <Typography variant="h6" color="info.main">Base Fee</Typography>
                    </Stack>
                    <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                      €{costDataMoney.baseFee.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly service charge
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Usage Summary */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Usage Summary</Typography>
              <Grid container spacing={3}>
                <Grid size={4}>
                  <Stack alignItems="center" spacing={1}>
                    <Typography variant="h5" color="primary">
                      {costDataMoney.breakdown.totalConsumption.toFixed(0)} kWh
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Consumption
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={4}>
                  <Stack alignItems="center" spacing={1}>
                    <Typography variant="h5" color="success.main">
                      {Math.round((costDataMoney.breakdown.pvConsumption / costDataMoney.breakdown.totalConsumption) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      From Solar
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={4}>
                  <Stack alignItems="center" spacing={1}>
                    <Typography variant="h5" color="success.main">
                      €{((costDataMoney.breakdown.totalConsumption * costDataMoney.breakdown.gridRate + costDataMoney.baseFee) - (costDataMoney.totalCost + costDataMoney.baseFee)).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Saved vs Grid Only
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Invoice History Tab */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            {isLoadingInvoices ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : invoicesError ? (
              <Alert severity="error">
                Failed to load invoice history. Please try again later.
              </Alert>
            ) : !invoicesData?.invoices?.length ? (
              <Stack spacing={2} alignItems="center" py={4}>
                <ReceiptIcon sx={{ fontSize: 42, color: 'text.secondary' }} />
                <Typography variant="h6">No invoices found</Typography>
                <Typography color="text.secondary">
                  Generate your first invoice to see it here
                </Typography>
              </Stack>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice Number</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Consumption</TableCell>
                      <TableCell>Generated</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoicesData.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {invoice.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(invoice.startDate).toLocaleDateString()} - {new Date(invoice.endDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`€${invoice.totalAmount.toFixed(2)}`}
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {invoice.consumptionKwh.toFixed(1)} kWh
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(invoice.generatedAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={() => handleDownloadInvoice(invoice.id, invoice.filename)}
                            disabled={downloadInvoiceMutation.isPending}
                            color="primary"
                          >
                            {downloadInvoiceMutation.isPending ? (
                              <CircularProgress size={20} />
                            ) : (
                              <DownloadIcon />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </TabPanel>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
