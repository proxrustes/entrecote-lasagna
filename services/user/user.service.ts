// lib/services/user/user.service.ts
export type User = {
  id: string;
  createdAt: string;
  updatedAt: string;
  address: string;
  contractId?: string | null;
  iban?: string | null;
  name: string;
  type: string;
  // optional relations - shape can be expanded as needed
  tenantBuildings?: any[];
  ownedBuildings?: any[];
  consumptions?: any[];
  costs?: any[];
  invoices?: any[];
};

export async function fetchUser(
  userId: string,
  opts?: { include?: string[]; baseUrl?: string }
): Promise<User> {
  if (!userId) throw new Error("userId is required");

  const base = opts?.baseUrl ?? "";
  const query =
    opts?.include && opts.include.length
      ? `?include=${encodeURIComponent(opts.include.join(","))}`
      : "";

  const url = `${base}/api/users/${encodeURIComponent(userId)}${query}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "same-origin", // adjust if you use cookies/session
    headers: {
      Accept: "application/json",
    },
  });

  let body: any;
  try {
    body = await res.json();
  } catch (e) {
    // non-json responses
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    throw e;
  }

  if (!res.ok) {
    // If your API returns { error: '...' } or { errors: [...] }, adapt here
    const message =
      body?.error ||
      (Array.isArray(body?.errors)
        ? body.errors.map((x: any) => x.detail || x).join("; ")
        : undefined) ||
      body?.message ||
      `Failed to fetch user: ${res.status}`;
    throw new Error(message);
  }

  // Expecting the API to return { data: user }
  if (!body?.data) {
    throw new Error("Unexpected API response shape");
  }

  return body.data as User;
}
