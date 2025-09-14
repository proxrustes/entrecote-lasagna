import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const landlordId = searchParams.get('landlordId')
    const buildingId = searchParams.get('buildingId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') || 'combined'

    if (!landlordId) {
      return NextResponse.json(
        { error: 'landlordId is required' },
        { status: 400 }
      )
    }

    // Set default time range to last year if not provided
    const now = new Date()
    const defaultStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const timeStart = startDate ? new Date(startDate) : defaultStartDate
    const timeEnd = endDate ? new Date(endDate) : now

    // Get landlord's buildings
    const buildings = await prisma.building.findMany({
      where: {
        landlordId,
        ...(buildingId && { id: buildingId })
      },
      include: {
        settlement: true,
        devices: true,
        tenants: {
          include: {
            tenant: true
          }
        }
      }
    })

    if (buildings.length === 0) {
      return NextResponse.json(
        { error: 'No buildings found for this landlord' },
        { status: 404 }
      )
    }

    let totalProfitFromTenants = 0
    let totalProfitFromFeeding = 0

    for (const building of buildings) {
      const tenantIds = building.tenants.map(bt => bt.tenantId)
      const allUserIds = [...tenantIds, landlordId]

      // Use database-level aggregation for PV generation
      const pvGenerationResult = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
        `SELECT COALESCE(SUM(g."generationKwh"), 0) as total
         FROM pv_generations g
         JOIN devices d ON g."deviceId" = d.id
         WHERE d."buildingId" = $1 AND g.timestamp >= $2 AND g.timestamp <= $3`,
        building.id, timeStart, timeEnd
      )
      const totalPvGeneration = Number(pvGenerationResult[0]?.total || 0)

      // Use database-level aggregation for all consumption
      const allConsumptionResult = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
        `SELECT COALESCE(SUM("consumptionKwh"), 0) as total
         FROM consumptions
         WHERE "userId" = ANY($1::text[]) AND timestamp >= $2 AND timestamp <= $3`,
        allUserIds, timeStart, timeEnd
      )
      const totalConsumption = Number(allConsumptionResult[0]?.total || 0)

      // Use database-level aggregation for tenant consumption only
      const tenantConsumptionResult = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
        `SELECT COALESCE(SUM("consumptionKwh"), 0) as total
         FROM consumptions
         WHERE "userId" = ANY($1::text[]) AND timestamp >= $2 AND timestamp <= $3`,
        tenantIds, timeStart, timeEnd
      )
      const tenantConsumption = Number(tenantConsumptionResult[0]?.total || 0)

      // Get PV cost from tenant cost records
      const tenantCosts = await prisma.cost.findMany({
        where: {
          userId: { in: tenantIds }
        }
      })

      const avgPvCost = tenantCosts.length > 0
        ? tenantCosts.reduce((sum, cost) => sum + cost.pvCost, 0) / tenantCosts.length
        : 0

      // Calculate profit from tenants (PV used by tenants * PV cost)
      const pvUsedByTenants = Math.min(totalPvGeneration, tenantConsumption)
      const profitFromTenants = pvUsedByTenants * avgPvCost

      // Calculate profit from feeding excess to grid
      let profitFromFeeding = 0
      if (totalPvGeneration > totalConsumption && building.settlement) {
        const excessPv = totalPvGeneration - totalConsumption
        profitFromFeeding = excessPv * building.settlement.feedingPrice
      }

      totalProfitFromTenants += profitFromTenants
      totalProfitFromFeeding += profitFromFeeding
    }

    // Return based on type parameter
    const response: {
      currency: string
      timeRange: { start: Date; end: Date }
      profitFromTenants?: number
      profitFromFeeding?: number
      totalProfit?: number
    } = {
      currency: 'EUR',
      timeRange: {
        start: timeStart,
        end: timeEnd
      }
    }

    if (type === 'tenants') {
      response.profitFromTenants = Number(totalProfitFromTenants.toFixed(2))
    } else if (type === 'feeding') {
      response.profitFromFeeding = Number(totalProfitFromFeeding.toFixed(2))
    } else {
      response.profitFromTenants = Number(totalProfitFromTenants.toFixed(2))
      response.profitFromFeeding = Number(totalProfitFromFeeding.toFixed(2))
      response.totalProfit = Number((totalProfitFromTenants + totalProfitFromFeeding).toFixed(2))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error calculating profit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}