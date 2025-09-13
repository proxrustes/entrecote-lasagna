import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const landlordId = searchParams.get("landlordId");
    const status = searchParams.get("status");

    if (!landlordId) {
      return NextResponse.json(
        { error: "landlordId is required" },
        { status: 400 }
      );
    }

    const buildings = await prisma.building.findMany({
      where: { landlordId },
      select: { id: true, address: true },
    });
    if (!buildings.length) return NextResponse.json([]);

    const buildingMap = new Map(buildings.map((b) => [b.id, b.address]));
    const devices = await prisma.device.findMany({
      where: {
        buildingId: { in: buildings.map((b) => b.id) },
        ...(status ? { status } : {}),
      },
      select: {
        id: true,
        deviceId: true,
        status: true,
        buildingId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    if (!devices.length) return NextResponse.json([]);

    const deviceIds = devices.map((d) => d.id);

    // latest reading
    const latestReadingsRaw = await prisma.pvGeneration.findMany({
      where: { deviceId: { in: deviceIds } },
      select: { deviceId: true, timestamp: true, generationKwh: true },
      orderBy: { timestamp: "desc" },
      take: Math.max(deviceIds.length * 3, 100),
    });
    const latestByDevice = new Map<
      string,
      { timestamp: string; kWh: number }
    >();
    for (const r of latestReadingsRaw) {
      if (!latestByDevice.has(r.deviceId)) {
        latestByDevice.set(r.deviceId, {
          timestamp: r.timestamp.toISOString(),
          kWh: r.generationKwh,
        });
      }
      if (latestByDevice.size === deviceIds.length) break;
    }

    // today sum
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayGroup = await prisma.pvGeneration.groupBy({
      by: ["deviceId"],
      where: { deviceId: { in: deviceIds }, timestamp: { gte: startOfDay } },
      _sum: { generationKwh: true },
    });
    const todayMap = new Map(
      todayGroup.map((g) => [g.deviceId, g._sum.generationKwh ?? 0])
    );

    // total sum (за всё время)  << ДОБАВЛЕНО
    const totalGroup = await prisma.pvGeneration.groupBy({
      by: ["deviceId"],
      where: { deviceId: { in: deviceIds } },
      _sum: { generationKwh: true },
    });
    const totalMap = new Map(
      totalGroup.map((g) => [g.deviceId, g._sum.generationKwh ?? 0])
    );

    const payload = devices.map((d) => ({
      id: d.id,
      deviceId: d.deviceId,
      status: d.status,
      buildingId: d.buildingId,
      buildingAddress: buildingMap.get(d.buildingId) ?? "",
      lastReading: latestByDevice.get(d.id) ?? null,
      todayKWh: +(todayMap.get(d.id) ?? 0),
      totalKWh: +(totalMap.get(d.id) ?? 0),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    return NextResponse.json(payload);
  } catch (e) {
    console.error("GET /api/devices error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
