import { Stack, Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

export function CardHeader(props: { address: string; name: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={1}>
        <HomeIcon sx={{ fontSize: 32 }} />
        <Typography variant="h6">My Home — {props.address}</Typography>
      </Stack>
      <Typography color="text.secondary">Unit: {props.name}</Typography>
    </Stack>
  );
}
