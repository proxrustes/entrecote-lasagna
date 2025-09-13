"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";

export default function SettingsPage() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">User Settings</Typography>
        <Stack spacing={2} mt={2}>
          <TextField label="Name" defaultValue="John Doe" fullWidth />
          <TextField label="Email" defaultValue="john@example.com" fullWidth />
          <Button variant="contained">Save</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
