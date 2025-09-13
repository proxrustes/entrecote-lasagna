import {
  Card,
  CardContent,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import { MOCK_HOUSES as HOUSES } from "../../lib/mockData";

// --- landlord view (overview across houses/units)
export function LandlordBilling() {
  const rows = HOUSES.flatMap((h) =>
    h.units.flatMap((u) =>
      u.bills.map((b) => ({
        house: h.address,
        unit: u.name,
        tenant: u.tenant.name,
        month: b.month,
        amount: b.amount,
        status: b.status,
      }))
    )
  );

  const total = rows.reduce((a, r) => a + r.amount, 0);

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="h6">Billing Overview</Typography>
          <Typography color="text.secondary">
            Total across houses: € {total}
          </Typography>
        </Stack>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>House</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Month</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={`${r.house}-${r.unit}-${r.month}-${idx}`}>
                <TableCell>{r.house}</TableCell>
                <TableCell>{r.unit}</TableCell>
                <TableCell>{r.tenant}</TableCell>
                <TableCell>{r.month}</TableCell>
                <TableCell align="right">€ {r.amount}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.status}
                    color={r.status === "Paid" ? "success" : "warning"}
                    variant={r.status === "Paid" ? "filled" : "outlined"}
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
