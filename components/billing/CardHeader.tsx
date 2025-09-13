import { Stack, Typography } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export function CardHeader(props: {
  house: string;
  unit: string;
  total: number;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={1}>
        <AccountBalanceWalletIcon sx={{ fontSize: 32 }} />
        <Typography variant="h6">
          My Bills — {props.house}, Unit {props.unit}
        </Typography>
      </Stack>
      <Typography color="text.secondary">Total: € {props.total}</Typography>
    </Stack>
  );
}
