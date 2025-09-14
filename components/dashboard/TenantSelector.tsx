// TenantSelector.tsx
import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

export function TenantSelector({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>Tenant</InputLabel>
      <Select
        value={value}
        label="Tenant"
        onChange={(e) => onChange(e.target.value as string)}
      >
        <MenuItem value="all">All</MenuItem>
        {options.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
