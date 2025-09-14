// RangeSelector.tsx
import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import type { RangeKey } from "./mapRangeKeyToPeriod";

export function RangeSelector({
  value,
  onChange,
  disabled,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
  disabled?: boolean;
}) {
  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>Range</InputLabel>
      <Select
        value={value}
        label="Range"
        onChange={(e) => onChange(e.target.value as RangeKey)}
      >
        <MenuItem value="today">Today</MenuItem>
        <MenuItem value="week">Last week</MenuItem>
        <MenuItem value="month">Last month</MenuItem>
        <MenuItem value="year">Last year</MenuItem>
      </Select>
    </FormControl>
  );
}
