import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlordId");

    if (!landlordId) {
      return NextResponse.json(
        { error: "landlordId is required" },
        { status: 400 }
      );
    }

    const buildings = await prisma.building.findMany({
      where: { landlordId },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
        tenants: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                contractId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const payload = buildings.map((b) => ({
      id: b.id,
      buildingId: b.buildingId,
      address: b.address,
      provider: b.provider,
      tenants: b.tenants.map((bt) => bt.tenant),
    }));

    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/buildings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
