import { Provider } from "../types/Provider";

export async function getProviders(): Promise<Provider[]> {
  const res = await fetch("/api/providers", { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/providers ${res.status}`);
  return res.json();
}

export async function createProdiver(
  payload: Omit<Provider, "id" | "createdAt" | "updatedAt">
) {
  const res = await fetch("/api/providers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg?.error || `POST /api/providers ${res.status}`);
  }
  return (await res.json()) as Provider;
}
