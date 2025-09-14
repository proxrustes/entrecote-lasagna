import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import { PieChart } from "@mui/x-charts";
import { useSession } from "next-auth/react";
import SavingsIcon from "@mui/icons-material/Savings";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import EuroIcon from "@mui/icons-material/Euro";
import { CardHeader } from "./CardHeader";
import { useTenantCosts } from "../../services/costs/costs.hooks";
import { isMoney } from "../../services/costs/costs.service";
import { useTenantLandlord } from "../../services/tenant/tenant.hooks";
import { CurrentBillCard } from "./CurrentBillCard";

export function TenantDashboard() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Get landlordId for tenant user
  const { data: landlordData, isLoading: isLoadingLandlord } =
    useTenantLandlord(userId);
  const landlordId = landlordData?.landlordId;

  const {
    data: costsData,
    isLoading: isLoadingCosts,
    error,
  } = useTenantCosts(userId && landlordId ? { userId, landlordId } : undefined);

  const isLoading = isLoadingLandlord || isLoadingCosts;

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load your energy data. Please try again later.
      </Alert>
    );
  }

  const costData = costsData && isMoney(costsData) ? costsData : null;

  // Calculate savings compared to if all energy came from grid
  const gridOnlyCost = costData
    ? costData.breakdown.totalConsumption * costData.breakdown.gridRate +
      costData.baseFee
    : 0;
  const actualCost = costData ? costData.totalCost + costData.baseFee : 0;
  const moneySaved = gridOnlyCost - actualCost;

  return (
    <Grid container spacing={3}>
      {/* Header */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <CardHeader
              address={(session?.user as any)?.address || "Loading..."}
              name={session?.user?.name || "Loading..."}
              contractNumber={(session?.user as any)?.contractId || "N/A"}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Money Saved - Most Important */}
      <Grid size={6}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
            color: "white",
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <SavingsIcon sx={{ fontSize: 48 }} />
              <Box>
                <Typography variant="h6">Money Saved This Month</Typography>
                <Typography variant="h3">
                  €{moneySaved > 0 ? moneySaved.toFixed(2) : "0.00"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Thanks to solar energy
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Current Bill */}
      <Grid size={6}>
        <CurrentBillCard
          total={actualCost ?? 0}
          baseFee={costData?.baseFee ?? 0}
        />
      </Grid>

      {/* Energy Usage Summary */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Energy Usage This Month
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={4}>
                <Stack alignItems="center" spacing={1}>
                  <ElectricBoltIcon sx={{ fontSize: 40, color: "info.main" }} />
                  <Typography variant="h5">
                    {costData?.breakdown.totalConsumption.toFixed(0) || "0"} kWh
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    Total Energy Used
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={4}>
                <Stack alignItems="center" spacing={1}>
                  <SolarPowerIcon
                    sx={{ fontSize: 40, color: "success.main" }}
                  />
                  <Typography variant="h5" color="success.main">
                    {costData?.breakdown.pvConsumption.toFixed(0) || "0"} kWh
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    From Solar (Cheaper!)
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={4}>
                <Stack alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background:
                        costData &&
                        costData.breakdown.pvConsumption /
                          costData.breakdown.totalConsumption >
                          0.5
                          ? "linear-gradient(135deg, #4caf50, #66bb6a)"
                          : "linear-gradient(135deg, #ff9800, #ffb74d)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                    }}
                  >
                    {costData
                      ? Math.round(
                          (costData.breakdown.pvConsumption /
                            costData.breakdown.totalConsumption) *
                            100
                        )
                      : 0}
                    %
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    Solar Coverage
                  </Typography>
                  <Chip
                    label={
                      costData &&
                      costData.breakdown.pvConsumption /
                        costData.breakdown.totalConsumption >
                        0.5
                        ? "Excellent!"
                        : "Good savings!"
                    }
                    color={
                      costData &&
                      costData.breakdown.pvConsumption /
                        costData.breakdown.totalConsumption >
                        0.5
                        ? "success"
                        : "primary"
                    }
                    size="small"
                  />
                </Stack>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {costData && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Cost Breakdown
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    height: 280,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <PieChart
                    series={[
                      {
                        data: [
                          {
                            id: 0,
                            value: costData.pvCost,
                            label: `Solar €${costData.pvCost.toFixed(2)}`,
                            color: "#4caf50",
                          },
                          {
                            id: 1,
                            value: costData.gridCost,
                            label: `Grid €${costData.gridCost.toFixed(2)}`,
                            color: "#ff9800",
                          },
                          {
                            id: 2,
                            value: costData.baseFee,
                            label: `Base Fee €${costData.baseFee.toFixed(2)}`,
                            color: "#9e9e9e",
                          },
                        ],
                      },
                    ]}
                    width={500}
                    height={250}
                  />
                </Box>
                <Stack
                  direction="row"
                  justifyContent="center"
                  spacing={4}
                  sx={{ mt: 2 }}
                >
                  <Typography variant="body2" color="success.main">
                    ● Solar: €{costData.breakdown.pvRate.toFixed(3)}/kWh
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    ● Grid: €{costData.breakdown.gridRate.toFixed(3)}/kWh
                  </Typography>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
