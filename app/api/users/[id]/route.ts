import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@/app/generated/prisma";

type ApiError = { error: string };
type ApiSuccess = { data: any };

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess | ApiError>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid or missing user id" });
  }

  const includeParam =
    typeof req.query.include === "string" ? req.query.include : "";
  const includes = includeParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const include: Record<string, boolean | object> = {};
  if (includes.includes("tenantBuildings")) {
    include.tenantBuildings = { include: { building: true } };
  }
  if (includes.includes("ownedBuildings")) include.ownedBuildings = true;
  if (includes.includes("consumptions")) include.consumptions = true;
  if (includes.includes("costs")) include.costs = true;
  if (includes.includes("invoices")) include.invoices = true;
  // don't include authentication by default (sensitive)

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: Object.keys(include).length ? include : undefined,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Mask or remove sensitive fields before sending out
    // (например IBAN и потенциальная authentication)
    // Если хотите вернуть IBAN — уберите следующую строку.
    const { iban, authentication, ...publicUser } = user as any;

    return res.status(200).json({ data: publicUser });
  } catch (e: any) {
    console.error("GET /api/users/[id] error:", e);
    return res
      .status(500)
      .json({ error: e?.message ?? "Internal server error" });
  }
}
