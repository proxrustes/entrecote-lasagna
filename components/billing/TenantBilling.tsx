import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stack,
  Box,
  Alert,
  Grid,
  Divider
} from "@mui/material";
import { useSession } from "next-auth/react";
import HomeIcon from "@mui/icons-material/Home";
import EuroIcon from "@mui/icons-material/Euro";
import { CardHeader } from "../dashboard/CardHeader";
import { useTenantCosts } from "../../services/costs/costs.hooks";
import { isMoney } from "../../services/costs/costs.service";
import { useTenantLandlord } from "../../services/tenant/tenant.hooks";

export function TenantBilling() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Get landlordId for tenant user
  const { data: landlordData, isLoading: isLoadingLandlord } = useTenantLandlord(userId);
  const landlordId = landlordData?.landlordId;

  const { data: costsData, isLoading: isLoadingCosts, error } = useTenantCosts(
    userId && landlordId ? { userId, landlordId } : undefined
  );

  const isLoading = isLoadingLandlord || isLoadingCosts;

  const costDataMoney = costsData && isMoney(costsData) ? costsData : null;

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
                    €{(costDataMoney.totalCost + costDataMoney.baseFee).toFixed(2)}
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

      </Grid>
    </Box>
  );
}
