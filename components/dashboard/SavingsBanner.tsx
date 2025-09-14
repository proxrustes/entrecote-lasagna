// SavingsBanner.tsx
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Box,
  Grid,
} from "@mui/material";
import SavingsIcon from "@mui/icons-material/Savings";
import { useConsumption } from "../../services/consumption/consumption.hooks";
import { useGeneration } from "../../services/generation/generation.hooks";

const EUR_PER_KWH = 0.3;

function sumKwh(rows: Array<{ kWh?: number } | any> | undefined) {
  if (!rows || !Array.isArray(rows)) return 0;
  return rows.reduce(
    (acc, r) => acc + (Number.isFinite(r?.kWh) ? r.kWh : 0),
    0
  );
}

export function SavingsBanner({
  landlordId,
  verb,
}: {
  landlordId?: string;
  verb: string;
}) {
  const period: "1month" = "1month";

  const {
    data: consData,
    isLoading: consLoading,
    error: consError,
  } = useConsumption(landlordId ? { landlordId, period } : undefined);

  const {
    data: genData,
    isLoading: genLoading,
    error: genError,
  } = useGeneration(landlordId ? { landlordId, period } : undefined);

  const loading = consLoading || genLoading;
  const error = consError || genError;

  const sumConsumption = sumKwh(consData);
  const sumGeneration = sumKwh(genData);

  const matched = Math.min(sumConsumption, sumGeneration);
  const savings = matched * EUR_PER_KWH;

  if (!landlordId) return null;

  return (
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
            <Typography variant="h6">Money {verb} This Month</Typography>
            <Typography variant="h3">
              €{savings > 0 ? savings.toFixed(2) : "0.00"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Thanks to solar energy
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
