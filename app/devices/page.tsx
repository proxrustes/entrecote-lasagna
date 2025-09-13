"use client";
import * as React from "react";
import { DevicesTable } from "../../components/devices/DevicesTable";
import { DEVICES_MOCK } from "../../components/devices/mocks";
import { Stack, Typography } from "@mui/material";

export default function DashboardPage() {
  return (
    <Stack gap={2}>
      <Typography variant="h6" gutterBottom>
        Devices
      </Typography>
      <DevicesTable rows={DEVICES_MOCK} />;
    </Stack>
  );
}
