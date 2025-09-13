"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { LandlordMonthlyTenantCostsTable } from "./LandlordMonthlyTenantCostsTable";

export default function LandlordBilling() {
  const { data: session } = useSession();
  const landlordId = (session as any)?.user?.id;

  if (!landlordId) return null; // или заглушка

  return <LandlordMonthlyTenantCostsTable landlordId={landlordId} />;
}
