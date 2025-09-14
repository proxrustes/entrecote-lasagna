import { Stack, Typography, Chip } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

type Props = {
  name: string;
  contractNumber: string;
};

export function CardHeader({ name, contractNumber }: Props) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={2} alignItems="center">
        <HomeIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Stack>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            My Home
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {name}
          </Typography>
        </Stack>
      </Stack>

      {contractNumber && contractNumber !== "N/A" && (
        <Chip
          label={`# ${contractNumber}`}
          variant="outlined"
          color="primary"
          size="small"
        />
      )}
    </Stack>
  );
}
