import React from "react";
import { Card, CardContent, Stack, Box, Typography } from "@mui/material";
import EuroIcon from "@mui/icons-material/Euro";

export function CurrentBillCard({
  total,
  baseFee,
  currency = "EUR",
}: {
  total: number;
  baseFee: number;
  currency?: string;
}) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <EuroIcon sx={{ fontSize: 48, color: "primary.main" }} />
          <Box>
            <Typography variant="h6" color="primary">
              Your Bill This Month
            </Typography>
            <Typography variant="h3" color="primary">
              €{total.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Including €{baseFee.toFixed(2)} base fee ({currency})
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
