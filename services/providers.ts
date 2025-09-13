import { Provider } from "../types/Provider";

export async function getProviders(): Promise<Provider[]> {
  const res = await fetch("/api/providers", { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/providers ${res.status}`);
  return res.json();
}

export async function createProvider(
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

export type UpdateProviderPayload = Partial<
  Omit<Provider, "id" | "providerId" | "createdAt" | "updatedAt">
> & { name?: string };

export async function updateProvider(
  id: string,
  patch: UpdateProviderPayload
): Promise<Provider> {
  const url = `/api/providers/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `PUT ${url} -> ${res.status}`);
  return data as Provider;
}

export async function deleteProvider(id: string): Promise<void> {
  const url = `/api/providers/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `DELETE ${url} -> ${res.status}`);
}
