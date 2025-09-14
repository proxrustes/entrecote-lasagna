"use client";

import * as React from "react";
import { Box, Button, Container, Grid, Typography, Stack } from "@mui/material";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import BoltIcon from "@mui/icons-material/Bolt";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      {/* Hero Section */}
      <Grid container spacing={6} alignItems="center">
        <Grid size={6}>
          <Typography variant="h2" fontWeight={800} gutterBottom>
            RoofShare
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Turning rooftops into shared powerhouses. Affordable, green
            electricity for tenants and new value for landlords.
          </Typography>
          <Stack direction="row" spacing={2} mt={3}>
            <Button
              component={Link}
              href="/login"
              size="large"
              variant="contained"
            >
              Get Started
            </Button>
          </Stack>
        </Grid>
        <Grid size={6}>
          <Box
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: 3,
              p: 0,
            }}
          >
            <Image
              src="https://i.pinimg.com/736x/6f/9d/70/6f9d702ad6154d8c104bf57dd6d77b50.jpg"
              alt="Solar panels on roof"
              width={800}
              height={500}
              style={{ width: "100%", lineHeight: 0, objectFit: "cover" }}
            />
          </Box>
        </Grid>
      </Grid>

      <Box mt={12}>
        <Typography variant="h4" align="center" fontWeight={700} gutterBottom>
          Why RoofShare?
        </Typography>
        <Grid container spacing={4} mt={2}>
          <Grid size={4}>
            <Stack spacing={2} alignItems="center">
              <SolarPowerIcon color="warning" sx={{ fontSize: 48 }} />
              <Typography variant="h6">Green Energy</Typography>
              <Typography align="center" color="text.secondary">
                Rooftop solar generation reduces CO₂ emissions and makes clean
                power accessible.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={4}>
            <Stack spacing={2} alignItems="center">
              <HomeWorkIcon color="primary" sx={{ fontSize: 48 }} />
              <Typography variant="h6">Fair for Tenants</Typography>
              <Typography align="center" color="text.secondary">
                Transparent billing and cost savings shared directly with
                residents.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={4}>
            <Stack spacing={2} alignItems="center">
              <BoltIcon color="success" sx={{ fontSize: 48 }} />
              <Typography variant="h6">New Value for Landlords</Typography>
              <Typography align="center" color="text.secondary">
                Unlock extra revenue streams and increase property
                attractiveness.
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
