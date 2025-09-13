"use client";
import * as React from "react";
import { useSession } from "next-auth/react";
import { LandlordDashboard } from "../../components/dashboard/LandlordDashboard";
import { TenantDashboard } from "../../components/dashboard/TenantDashboard";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "tenant";
  return role === "landlord" ? <LandlordDashboard /> : <TenantDashboard />;
}
