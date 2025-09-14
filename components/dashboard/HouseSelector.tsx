// HouseSelector.tsx
import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from "@mui/material";
import type { BuildingSummary } from "../../services/buildings/buildings";

export function HouseSelector({
  buildings,
  value,
  onChange,
  disabled,
  loading,
  fetching,
}: {
  buildings?: BuildingSummary[] | null;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
  fetching?: boolean;
}) {
  return (
    <FormControl fullWidth disabled={disabled || !!loading}>
      <InputLabel>House</InputLabel>
      <Select
        value={value}
        label="House"
        onChange={(e) => onChange(e.target.value as string)}
      >
        {(buildings ?? []).map((b) => (
          <MenuItem key={b.id} value={b.id}>
            {b.address || b.buildingId || b.id}
          </MenuItem>
        ))}
      </Select>
      {(loading || fetching) && <LinearProgress sx={{ mt: 1 }} />}
    </FormControl>
  );
}
