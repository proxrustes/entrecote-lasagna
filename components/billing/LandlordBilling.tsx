"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Stack,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  LinearProgress
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DownloadIcon from "@mui/icons-material/Download";
import GenerateIcon from "@mui/icons-material/Create";
import GroupIcon from "@mui/icons-material/Group";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import BusinessIcon from "@mui/icons-material/Business";
import EuroIcon from "@mui/icons-material/Euro";
import { LandlordMonthlyTenantCostsTable } from "./LandlordMonthlyTenantCostsTable";
import { useTenantCosts } from "../../services/costs/useTenantCosts";
import { MonthSelector } from "./MonthSelector";
import { TenantCostsChart } from "./TenantCostsChart";
import { CardHeader } from "../dashboard/CardHeader";
import { useInvoices, useGenerateInvoice, useDownloadInvoice } from "../../services/invoices/invoices.hooks";

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
      id={`landlord-billing-tabpanel-${index}`}
      aria-labelledby={`landlord-billing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LandlordBilling() {
  const { data: session } = useSession();
  const landlordId = (session as any)?.user?.id ?? null;
  const [tabValue, setTabValue] = React.useState(0);
  const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false);
  const [bulkGenerateDialogOpen, setBulkGenerateDialogOpen] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState<any>(null);
  const [startDate, setStartDate] = React.useState<Date | null>(null);
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");

  const [selectedMonth, setSelectedMonth] = React.useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { rows, loading, error, refresh } = useTenantCosts(
    landlordId,
    selectedMonth
  );

  // Invoice data - get all invoices (no userId filter for landlord to see all invoices)
  const { data: invoicesData, isLoading: isLoadingInvoices, error: invoicesError, refetch: refetchInvoices } = useInvoices(undefined);

  // Mutations
  const generateInvoiceMutation = useGenerateInvoice();
  const downloadInvoiceMutation = useDownloadInvoice();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedTenant || !startDate || !endDate) {
      setSnackbarMessage("Please select tenant and date range");
      setSnackbarOpen(true);
      return;
    }

    try {
      await generateInvoiceMutation.mutateAsync({
        userId: selectedTenant.tenantId,
        startDate: startDate,
        endDate: endDate,
        landlordId: landlordId
      });

      setSnackbarMessage(`✅ Invoice generated successfully for ${selectedTenant.tenantName}!`);
      setSnackbarOpen(true);
      setGenerateDialogOpen(false);

      // Clear form
      setSelectedTenant(null);
      setStartDate(null);
      setEndDate(null);

      // Refresh data
      try {
        await refetchInvoices();
        refresh();
      } catch (refreshError) {
        console.error('Error refreshing data after invoice generation:', refreshError);
      }

    } catch (error) {
      console.error('Invoice generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSnackbarMessage(`❌ Failed to generate invoice: ${errorMessage}`);
      setSnackbarOpen(true);
    }
  };

  const handleBulkGenerate = async () => {
    if (!startDate || !endDate || rows.length === 0) {
      setSnackbarMessage("Please select date range");
      setSnackbarOpen(true);
      return;
    }

    try {
      const validTenants = rows.filter(r => r.costs && r.tenantId);

      if (validTenants.length === 0) {
        setSnackbarMessage("No valid tenants found for invoice generation");
        setSnackbarOpen(true);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process tenants sequentially to avoid overwhelming the API
      for (const tenant of validTenants) {
        try {
          await generateInvoiceMutation.mutateAsync({
            userId: tenant.tenantId,
            startDate: startDate,
            endDate: endDate,
            landlordId: landlordId
          });
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${tenant.tenantName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error(`Failed to generate invoice for ${tenant.tenantName}:`, error);
        }
      }

      // Show detailed results
      if (errorCount === 0) {
        setSnackbarMessage(`✅ All ${successCount} invoices generated successfully!`);
      } else if (successCount === 0) {
        setSnackbarMessage(`❌ Failed to generate all invoices. Check console for details.`);
      } else {
        setSnackbarMessage(`⚠️ Partial success: ${successCount} successful, ${errorCount} failed`);
      }

      setSnackbarOpen(true);
      setBulkGenerateDialogOpen(false);

      // Refresh data after bulk generation
      try {
        await refetchInvoices();
        refresh();
      } catch (refreshError) {
        console.error('Error refreshing data after bulk generation:', refreshError);
      }

    } catch (error) {
      console.error('Bulk generation error:', error);
      setSnackbarMessage("❌ Bulk invoice generation failed. Please try again.");
      setSnackbarOpen(true);
    }
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

  if (!landlordId) return null;

  if (loading && rows.length === 0) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <BusinessIcon sx={{ fontSize: 42, color: 'text.secondary' }} />
            <Typography variant="h6">Loading Landlord Billing...</Typography>
            <LinearProgress sx={{ width: '100%' }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = rows.reduce((sum, r) => {
    if (!r.costs) return sum;
    return sum + r.costs.totalCost + r.costs.baseFee;
  }, 0);

  const totalTenants = rows.filter(r => r.costs).length;

  return (
      <Box>
        {/* Header Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <CardHeader
              name={session?.user?.name || "Loading..."}
              contractNumber="Landlord Dashboard"
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="landlord billing tabs">
              <Tab icon={<CalendarTodayIcon />} label="Monthly Overview" />
              <Tab icon={<GenerateIcon />} label="Invoice Management" />
              <Tab icon={<ReceiptIcon />} label="Invoice History" />
            </Tabs>
          </Box>

          {/* Monthly Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <MonthSelector
                  selectedMonth={selectedMonth}
                  onChange={setSelectedMonth}
                />
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={() => void refresh()}
                  disabled={loading}
                  variant="outlined"
                  size="small"
                >
                  Refresh
                </Button>
              </Stack>

              {error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <>
                  {/* Summary Cards */}
                  <Grid container spacing={3} mb={4}>
                    <Grid size={4}>
                      <Card sx={{
                        background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                        color: 'white',
                        height: '100%'
                      }}>
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                            <EuroIcon sx={{ fontSize: 32 }} />
                            <Typography variant="h6">Total Revenue</Typography>
                          </Stack>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            €{totalRevenue.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Current month billing
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                            <GroupIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Typography variant="h6" color="primary.main">Active Tenants</Typography>
                          </Stack>
                          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                            {totalTenants}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            With billing data
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                            <ReceiptIcon sx={{ fontSize: 32, color: 'info.main' }} />
                            <Typography variant="h6" color="info.main">Avg Per Tenant</Typography>
                          </Stack>
                          <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                            €{totalTenants > 0 ? (totalRevenue / totalTenants).toFixed(2) : '0.00'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Average billing
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Chart and Table */}
                  <TenantCostsChart rows={rows} />
                  <Box mt={3}>
                    <LandlordMonthlyTenantCostsTable rows={rows} />
                  </Box>
                </>
              )}
            </CardContent>
          </TabPanel>

          {/* Invoice Management Tab */}
          <TabPanel value={tabValue} index={1}>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="h6">Generate Invoices</Typography>

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Stack spacing={2} alignItems="center">
                          <GenerateIcon sx={{ fontSize: 42, color: 'primary.main' }} />
                          <Typography variant="h6" textAlign="center">
                            Individual Invoice
                          </Typography>
                          <Typography variant="body2" color="text.secondary" textAlign="center">
                            Generate invoice for a specific tenant
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<GenerateIcon />}
                            onClick={() => setGenerateDialogOpen(true)}
                            disabled={rows.length === 0}
                            fullWidth
                          >
                            Generate Individual
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Stack spacing={2} alignItems="center">
                          <GroupIcon sx={{ fontSize: 42, color: 'secondary.main' }} />
                          <Typography variant="h6" textAlign="center">
                            Bulk Generation
                          </Typography>
                          <Typography variant="body2" color="text.secondary" textAlign="center">
                            Generate invoices for all tenants
                          </Typography>
                          <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<GroupIcon />}
                            onClick={() => setBulkGenerateDialogOpen(true)}
                            disabled={rows.length === 0}
                            fullWidth
                          >
                            Generate Bulk
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Current Tenants Preview */}
                <Box>
                  <Typography variant="h6" gutterBottom>Current Tenants ({totalTenants})</Typography>
                  <Grid container spacing={2}>
                    {rows.filter(r => r.costs).map((tenant) => (
                      <Grid size={4} key={tenant.tenantId}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {tenant.tenantName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {tenant.contractId || 'No contract ID'}
                            </Typography>
                            <Typography variant="h6" color="primary.main" mt={1}>
                              €{tenant.costs ? (tenant.costs.totalCost + tenant.costs.baseFee).toFixed(2) : '0.00'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Stack>
            </CardContent>
          </TabPanel>

          {/* Invoice History Tab */}
          <TabPanel value={tabValue} index={2}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Invoice History</Typography>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={() => refetchInvoices()}
                  disabled={isLoadingInvoices}
                  variant="outlined"
                  size="small"
                >
                  Refresh
                </Button>
              </Stack>
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
                  <Typography variant="h6">No invoices generated yet</Typography>
                  <Typography color="text.secondary" textAlign="center">
                    Use the Invoice Management tab to generate invoices for your tenants
                  </Typography>
                </Stack>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice Number</TableCell>
                        <TableCell>Tenant</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Consumption</TableCell>
                        <TableCell>Generated</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoicesData?.invoices?.map((invoice) => {
                        // Add safety checks for invoice data
                        if (!invoice || !invoice.id) {
                          console.warn('Invalid invoice data:', invoice);
                          return null;
                        }

                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {invoice.invoiceNumber || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {invoice.user?.name || 'Unknown User'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {invoice.user?.contractId || 'No contract'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {invoice.startDate && invoice.endDate
                                  ? `${new Date(invoice.startDate).toLocaleDateString()} - ${new Date(invoice.endDate).toLocaleDateString()}`
                                  : 'Invalid dates'
                                }
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`€${(invoice.totalAmount || 0).toFixed(2)}`}
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {(invoice.consumptionKwh || 0).toFixed(1)} kWh
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {invoice.generatedAt
                                  ? new Date(invoice.generatedAt).toLocaleDateString()
                                  : 'Unknown'
                                }
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                onClick={() => handleDownloadInvoice(invoice.id, invoice.filename || `invoice-${invoice.id}.pdf`)}
                                disabled={downloadInvoiceMutation.isPending}
                                color="primary"
                                title="Download Invoice"
                              >
                                {downloadInvoiceMutation.isPending ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <DownloadIcon />
                                )}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      }).filter(Boolean)}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </TabPanel>
        </Card>

        {/* Individual Invoice Generation Dialog */}
        <Dialog
          open={generateDialogOpen}
          onClose={() => setGenerateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" component="div">
              Generate Individual Invoice
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3}>
              <TextField
                select
                label="Select Tenant"
                value={selectedTenant?.tenantId || ''}
                onChange={(e) => {
                  const tenant = rows.find(r => r.tenantId === e.target.value);
                  setSelectedTenant(tenant);
                }}
                SelectProps={{ native: true }}
                fullWidth
                variant="outlined"
              >
                <option value="">Choose a tenant...</option>
                {rows.filter(r => r.costs).map((tenant) => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.tenantName}
                  </option>
                ))}
              </TextField>

              <TextField
                label="Start Date"
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                variant="outlined"
              />

              <TextField
                label="End Date"
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => setGenerateDialogOpen(false)}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateInvoice}
              variant="contained"
              disabled={generateInvoiceMutation.isPending || !selectedTenant || !startDate || !endDate}
              startIcon={generateInvoiceMutation.isPending ? <CircularProgress size={16} /> : <GenerateIcon />}
            >
              {generateInvoiceMutation.isPending ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Invoice Generation Dialog */}
        <Dialog
          open={bulkGenerateDialogOpen}
          onClose={() => setBulkGenerateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" component="div">
              Bulk Invoice Generation
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3}>
              <Typography variant="body2" color="text.secondary">
                This will generate invoices for all {totalTenants} tenants with billing data.
              </Typography>

              <TextField
                label="Start Date"
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                variant="outlined"
              />

              <TextField
                label="End Date"
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => setBulkGenerateDialogOpen(false)}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkGenerate}
              variant="contained"
              color="secondary"
              disabled={generateInvoiceMutation.isPending || !startDate || !endDate}
              startIcon={generateInvoiceMutation.isPending ? <CircularProgress size={16} /> : <GroupIcon />}
            >
              {generateInvoiceMutation.isPending ? 'Generating...' : `Generate ${totalTenants} Invoices`}
            </Button>
          </DialogActions>
        </Dialog>

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
