import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { MOCK_HOUSES as HOUSES } from "../../app/dashboard/page";
import HomeIcon from "@mui/icons-material/Home";
import { CardHeader } from "./CardHeader";

export function TenantBilling() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const found =
    HOUSES.flatMap((h) =>
      h.units.map((u) => ({
        house: h.address,
        unit: u.name,
        tenantEmail: u.tenant.email,
        bills: u.bills,
      }))
    ).find((x) => x.tenantEmail === email) || null;

  if (!found) {
    return (
      <Card>
        <CardContent>
          <HomeIcon sx={{ fontSize: 42 }} />
          <Typography variant="h6">My Bills</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  const total = found.bills.reduce(
    (a, b) => (a + b.status !== "Paid" ? b.amount : 0),
    0
  );

  return (
    <Card>
      <CardContent>
        <CardHeader house={found.house} unit={found.unit} total={total} />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        ></Stack>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {found.bills.map((b, i) => (
              <TableRow key={`${b.month}-${i}`}>
                <TableCell>{b.month}</TableCell>
                <TableCell align="right">€ {b.amount}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={b.status}
                    color={b.status === "Paid" ? "success" : "warning"}
                    variant={b.status === "Paid" ? "filled" : "outlined"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
