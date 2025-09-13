// app/settings/page.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { MOCK_HOUSES as HOUSES } from "../dashboard/page";

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session as any)?.role ?? "tenant";
  const email = session?.user?.email ?? "tenant@test.com";

  const tenantData = React.useMemo(() => {
    if (role !== "tenant") return null;
    return (
      HOUSES.flatMap((h) =>
        h.units.map((u) => ({
          house: h.address,
          unit: u.name,
          tenantEmail: u.tenant.email,
          bills: u.bills,
        }))
      ).find((x) => x.tenantEmail === email) || null
    );
  }, [role, email]);

  const pending = tenantData
    ? tenantData.bills
        .filter((b) => b.status !== "Paid")
        .reduce((a, b) => a + b.amount, 0)
    : 0;

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6">User Settings</Typography>
          <Stack spacing={2} mt={2}>
            <TextField
              label="Name"
              defaultValue={session?.user?.name ?? "John Doe"}
              fullWidth
            />
            <TextField
              label="Email"
              defaultValue={session?.user?.email ?? "john@example.com"}
              fullWidth
            />
            <Button variant="contained">Save</Button>
          </Stack>
        </CardContent>
      </Card>

      {role === "tenant" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Billing & Payments
            </Typography>

            {tenantData ? (
              <Stack spacing={2}>
                <Typography color="text.secondary">
                  Address: {tenantData.house}, Unit {tenantData.unit}
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select defaultValue="sepa" label="Payment Method">
                        <MenuItem value="sepa">
                          SEPA Direct Debit (IBAN)
                        </MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="IBAN"
                      placeholder="DE12 3456 7890 1234 5678 90"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={6}>
                    <FormControl fullWidth>
                      <InputLabel>Preferred Due Date</InputLabel>
                      <Select defaultValue={5} label="Preferred Due Date">
                        {[1, 5, 10, 15, 20, 25].map((d) => (
                          <MenuItem key={d} value={d}>
                            {d} of each month
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={6}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable Autopay"
                    />
                  </Grid>
                </Grid>

                <Divider />
              </Stack>
            ) : (
              <Typography color="text.secondary">
                We couldn’t find your unit. Ask your landlord to link your
                account.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
