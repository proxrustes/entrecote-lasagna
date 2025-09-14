import { getJSON } from "../getJSON";

export const INVOICES_ENDPOINT = "/api/invoices";
export const INVOICES_DOWNLOAD_ENDPOINT = "/api/invoices/download";

export type Invoice = {
  id: string;
  invoiceNumber: string;
  userId: string;
  user: {
    id: string;
    name: string;
    address: string;
    contractId: string | null;
  };
  startDate: string; // ISO string
  endDate: string; // ISO string
  totalAmount: number;
  currency: string;
  consumptionKwh: number;
  gridCost: number;
  baseFee: number;
  dataPoints: number;
  filename: string;
  generatedAt: string; // ISO string
  createdAt: string; // ISO string
  pdfSize: number;
};

export type InvoicesResponse = {
  message: string;
  count: number;
  invoices: Invoice[];
};

export type GenerateInvoiceParams = {
  userId: string;
  startDate: string | Date;
  endDate: string | Date;
  landlordId?: string;
};

export type GenerateInvoiceResponse = {
  message: string;
  invoiceData: Record<string, unknown>;
  savedInvoice: {
    id: string;
    invoiceNumber: string;
    filename: string;
  };
  pdf?: {
    filename: string;
    size: number;
    base64: string;
  };
};

const toISO = (d: string | Date) =>
  typeof d === "string" ? new Date(d).toISOString() : d.toISOString();

export async function fetchInvoices(userId?: string): Promise<InvoicesResponse> {
  const qs = new URLSearchParams();
  if (userId) qs.set("userId", userId);

  return getJSON<InvoicesResponse>(
    `${INVOICES_ENDPOINT}?${qs.toString()}`
  );
}

export async function generateInvoice({
  userId,
  startDate,
  endDate,
  landlordId,
}: GenerateInvoiceParams): Promise<GenerateInvoiceResponse> {
  const response = await fetch(INVOICES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      startDate: toISO(startDate),
      endDate: toISO(endDate),
      landlordId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate invoice: ${response.statusText}`);
  }

  return response.json();
}

export function getDownloadUrl(invoiceId: string): string {
  return `${INVOICES_DOWNLOAD_ENDPOINT}?invoiceId=${invoiceId}`;
}

export async function downloadInvoice(invoiceId: string): Promise<Blob> {
  const response = await fetch(getDownloadUrl(invoiceId));

  if (!response.ok) {
    throw new Error(`Failed to download invoice: ${response.statusText}`);
  }

  return response.blob();
}