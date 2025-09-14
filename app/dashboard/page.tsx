"use client";
import * as React from "react";
import { useSession } from "next-auth/react";
import { LandlordDashboard } from "../../components/dashboard/LandlordDashboard";
import { TenantDashboard } from "../../components/dashboard/TenantDashboard";
import { LinearProgress } from "@mui/material";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  if (!role) return <LinearProgress />;
  return role === "landlord" ? <LandlordDashboard /> : <TenantDashboard />;
}
