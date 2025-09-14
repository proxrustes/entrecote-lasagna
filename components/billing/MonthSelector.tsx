import React, { useMemo } from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

function formatMonthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function generateRecentMonths(count = 12, from = new Date()) {
  const months: Date[] = [];
  for (let i = 0; i < count; i++) {
    months.push(new Date(from.getFullYear(), from.getMonth() - i, 1));
  }
  return months;
}

export type MonthSelectorProps = {
  selectedMonth: Date;
  onChange: (d: Date) => void;
  monthsCount?: number;
  sx?: any;
};

function MonthSelectorComponent({
  selectedMonth,
  onChange,
  monthsCount = 12,
  sx,
}: MonthSelectorProps) {
  const months = useMemo(
    () => generateRecentMonths(monthsCount),
    [monthsCount]
  );

  // value as ISO string for stable comparison
  const value = selectedMonth.toISOString();

  return (
    <FormControl size="small" variant="outlined" sx={sx}>
      <InputLabel id="month-select-label">Month</InputLabel>
      <Select
        labelId="month-select-label"
        value={value}
        label="Month"
        onChange={(e) => onChange(new Date(e.target.value as string))}
        sx={{ minWidth: 220 }}
      >
        {months.map((m) => (
          <MenuItem key={m.toISOString()} value={m.toISOString()}>
            {formatMonthLabel(m)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export const MonthSelector = React.memo(MonthSelectorComponent);
