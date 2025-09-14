"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Box,
  LinearProgress,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  FlashOn,
  Warning,
  Build,
  CheckCircle,
  Cancel,
  Schedule,
} from "@mui/icons-material";
import type { DeviceRow } from "./types";

const fmtKWh = (v: number) =>
  `${v.toLocaleString("en-GB", { maximumFractionDigits: 2 })} kWh`;

const fmtTS = (iso: string) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const StatusIcon = ({ status }: { status: DeviceRow["status"] }) => {
  const iconProps = { fontSize: "small" as const };

  switch (status) {
    case "online":
      return <CheckCircle {...iconProps} sx={{ color: "#22c55e" }} />;
    case "degraded":
      return <Warning {...iconProps} sx={{ color: "#f59e0b" }} />;
    case "maintenance":
      return <Build {...iconProps} sx={{ color: "#6366f1" }} />;
    case "error":
      return <Cancel {...iconProps} sx={{ color: "#ef4444" }} />;
    default:
      return <Schedule {...iconProps} sx={{ color: "#6b7280" }} />;
  }
};

const statusChip = (s: DeviceRow["status"]) => {
  switch (s) {
    case "online":
      return <Chip size="small" label="Online" color="success" />;
    case "degraded":
      return <Chip size="small" label="Degraded" color="warning" />;
    case "maintenance":
      return <Chip size="small" label="Maintenance" sx={{ bgcolor: "#6366f1", color: "white" }} />;
    case "error":
      return <Chip size="small" label="Error" color="error" />;
    default:
      return <Chip size="small" label="Offline" color="default" />;
  }
};

const MiniGenerationChart = ({ data = [] }: { data?: number[] }) => {
  const maxValue = Math.max(...data, 1);

  return (
    <Box sx={{ display: 'flex', alignItems: 'end', height: 40, gap: 0.5 }}>
      {data.map((value, index) => (
        <Box
          key={index}
          sx={{
            width: 4,
            height: `${(value / maxValue) * 100}%`,
            bgcolor: value > maxValue * 0.8 ? '#22c55e' : value > maxValue * 0.5 ? '#f59e0b' : '#ef4444',
            minHeight: 2,
            borderRadius: 0.5,
          }}
        />
      ))}
    </Box>
  );
};

const PerformanceIndicator = ({ efficiency }: { efficiency: number }) => {
  const getColor = (eff: number) => {
    if (eff >= 90) return '#22c55e';
    if (eff >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" color="text.secondary">
          Efficiency
        </Typography>
        <Typography variant="caption" fontWeight="bold" color={getColor(efficiency)}>
          {efficiency}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={efficiency}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: getColor(efficiency),
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
};

const DeviceCard = ({ device }: { device: DeviceRow }) => {
  const hasAlerts = (device.alertsCount || 0) > 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
        border: hasAlerts ? '2px solid' : '1px solid',
        borderColor: hasAlerts ? 'warning.main' : 'divider',
      }}
    >
      {hasAlerts && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <Tooltip title={`${device.alertsCount} active alerts`}>
            <Chip
              size="small"
              label={device.alertsCount}
              color="warning"
              icon={<Warning fontSize="small" />}
            />
          </Tooltip>
        </Box>
      )}

      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <StatusIcon status={device.status} />
          <Box flex={1}>
            <Typography variant="h6" component="div" fontWeight="bold">
              {device.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {device.address}
            </Typography>
          </Box>
        </Stack>

        {/* Status and Capacity */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          {statusChip(device.status)}
          {device.capacity && (
            <Typography variant="caption" color="text.secondary">
              {device.capacity} kW capacity
            </Typography>
          )}
        </Stack>

        {/* Generation Stats */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Today
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="primary.main">
                {fmtKWh(device.kwhProducedToday)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {fmtKWh(device.kwhProducedTotal)}
              </Typography>
            </Stack>

            {device.generationTrend && device.generationTrend.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  Recent Performance
                </Typography>
                <MiniGenerationChart data={device.generationTrend} />
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Performance Indicator */}
        {device.efficiency !== undefined && (
          <Box mb={2}>
            <PerformanceIndicator efficiency={device.efficiency} />
          </Box>
        )}

        {/* Additional Metrics */}
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Last Reading
            </Typography>
            <Typography variant="caption">
              {fmtTS(device.lastReadingAt)}
            </Typography>
          </Stack>

          {device.temperature !== undefined && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Panel Temp
              </Typography>
              <Typography variant="caption" color={device.temperature > 85 ? 'error.main' : 'text.primary'}>
                {device.temperature}°C
              </Typography>
            </Stack>
          )}

          {device.maintenanceDate && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Next Maintenance
              </Typography>
              <Typography variant="caption" color="warning.main">
                {new Date(device.maintenanceDate).toLocaleDateString()}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export function DevicesGrid({ rows }: { rows: DeviceRow[] }) {
  // Summary stats
  const onlineCount = rows.filter(d => d.status === 'online').length;
  const totalCapacity = rows.reduce((sum, d) => sum + (d.capacity || 0), 0);
  const totalTodayGeneration = rows.reduce((sum, d) => sum + d.kwhProducedToday, 0);
  const avgEfficiency = rows.length > 0 ?
    rows.reduce((sum, d) => sum + (d.efficiency || 0), 0) / rows.length : 0;

  return (
    <Stack spacing={3}>
      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary.main" fontWeight="bold">
            {onlineCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Devices Online
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary.main" fontWeight="bold">
            {totalCapacity.toFixed(1)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Capacity (kW)
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main" fontWeight="bold">
            {fmtKWh(totalTodayGeneration)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Today&apos;s Generation
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4"
            color={avgEfficiency >= 90 ? 'success.main' : avgEfficiency >= 70 ? 'warning.main' : 'error.main'}
            fontWeight="bold"
          >
            {avgEfficiency.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avg Efficiency
          </Typography>
        </Paper>
      </Box>

      {/* Devices Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
        {rows.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </Box>

      {rows.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FlashOn sx={{ fontSize: 48, color: "#9ca3af", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No devices found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add solar devices to start monitoring their performance.
          </Typography>
        </Paper>
      )}
    </Stack>
  );
}