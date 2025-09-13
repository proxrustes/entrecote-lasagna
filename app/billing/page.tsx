"use client";

import { useSession } from "next-auth/react";
import { TenantBilling } from "../../components/billing/TenantBilling";
import LandlordBilling from "../../components/billing/LandlordBilling";

export default function BillingPage() {
  const { data: session } = useSession();
  const role = (session as any)?.role ?? "tenant";
  return role === "landlord" ? <LandlordBilling /> : <TenantBilling />;
}
