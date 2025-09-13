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
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = React.useState<"profile" | "billing">("profile");

  const [autopay, setAutopay] = React.useState(true);
  const [dueDay, setDueDay] = React.useState<number>(5);
  const [payMethod, setPayMethod] = React.useState<"sepa" | "card">("sepa");
  const [invoiceFreq, setInvoiceFreq] = React.useState<"monthly" | "yearly">(
    "monthly"
  );

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab value="profile" label="Profile" />
            <Tab value="billing" label="Billing" />
          </Tabs>
        </CardContent>
        <Divider />
        {tab === "profile" && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Account Info
            </Typography>
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
              <TextField
                label="Password"
                type="password"
                placeholder="••••••••"
                fullWidth
              />
              <Button variant="contained">Save</Button>
            </Stack>
          </CardContent>
        )}

        {tab === "billing" && (
          <Stack spacing={2} sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Billing & Payments
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={payMethod}
                      label="Payment Method"
                      onChange={(e) =>
                        setPayMethod(e.target.value as "sepa" | "card")
                      }
                    >
                      <MenuItem value="sepa">SEPA Direct Debit (IBAN)</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={12}>
                  <TextField
                    label={payMethod === "sepa" ? "IBAN" : "Card number"}
                    placeholder={
                      payMethod === "sepa"
                        ? "DE12 3456 7890 1234 5678 90"
                        : "4242 4242 4242 4242"
                    }
                    fullWidth
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Cardholder Name"
                    placeholder={"Joe Mustermann"}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </CardContent>
            <Divider />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Autopay
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* Autopay toggle controls availability of due day */}
                <Grid size={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autopay}
                        onChange={(e) => setAutopay(e.target.checked)}
                      />
                    }
                    label="Enable Autopay"
                  />
                </Grid>

                <Grid size={6}>
                  <FormControl fullWidth disabled={!autopay}>
                    <InputLabel>Preferred Due Day</InputLabel>
                    <Select
                      value={dueDay}
                      label="Preferred Due Day"
                      onChange={(e) => setDueDay(Number(e.target.value))}
                    >
                      {[1, 5, 10, 15, 20, 25].map((d) => (
                        <MenuItem key={d} value={d}>
                          {d} of each month
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
            <Divider />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice frequency
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>Invoice Frequency</InputLabel>
                    <Select
                      value={invoiceFreq}
                      label="Invoice Frequency"
                      onChange={(e) =>
                        setInvoiceFreq(e.target.value as "monthly" | "yearly")
                      }
                    >
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
