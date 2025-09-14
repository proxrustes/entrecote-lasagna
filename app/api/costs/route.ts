import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'
import { allocateTenantEnergy } from '@/lib/energy/allocation'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const unit = searchParams.get('unit') || 'money'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Set default time range to current month if not provided (instead of full year)
    const now = new Date()
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1) // Start of current month
    const timeStart = startDate ? new Date(startDate) : defaultStartDate
    const timeEnd = endDate ? new Date(endDate) : now

    // Get tenant info and their building
    const tenant = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantBuildings: {
          include: {
            building: {
              include: {
                landlord: true,
                devices: true,
                tenants: {
                  include: {
                    tenant: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!tenant || tenant.tenantBuildings.length === 0) {
      return NextResponse.json(
        { error: 'Tenant or building not found' },
        { status: 404 }
      )
    }

    const building = tenant.tenantBuildings[0].building

    // Per-interval allocation using building totals and PV in the same window
    const tenantConsumptions = await prisma.consumption.findMany({
      where: {
        userId,
        timestamp: { gte: timeStart, lte: timeEnd },
      },
      orderBy: { timestamp: 'asc' },
    })

    const tenantIds = building.tenants.map(bt => bt.tenantId)
    const allUserIds = [...tenantIds, building.landlordId]

    const allConsumptions = await prisma.consumption.findMany({
      where: {
        userId: { in: allUserIds },
        timestamp: { gte: timeStart, lte: timeEnd },
      },
      orderBy: { timestamp: 'asc' },
    })

    const pvGenerations = await prisma.pvGeneration.findMany({
      where: {
        device: { buildingId: building.id },
        timestamp: { gte: timeStart, lte: timeEnd },
      },
      orderBy: { timestamp: 'asc' },
    })

    const alloc = allocateTenantEnergy(tenantConsumptions, allConsumptions, pvGenerations)
    const tenantPvKwh = alloc.pvKwh
    const tenantGridKwh = alloc.gridKwh
    const tenantConsumptionKwh = alloc.totalKwh

    // Get tenant's cost rates
    const tenantCost = await prisma.cost.findFirst({
      where: { userId }
    })

    if (!tenantCost) {
      return NextResponse.json(
        { error: 'Cost information not found for tenant' },
        { status: 404 }
      )
    }

    if (unit === 'kwh') {
      // Return kWh quantities
      return NextResponse.json({
        pvConsumption: Number(tenantPvKwh.toFixed(3)),
        gridConsumption: Number(tenantGridKwh.toFixed(3)),
        totalConsumption: Number(tenantConsumptionKwh.toFixed(3)),
        unit: 'kWh',
        timeRange: { start: timeStart, end: timeEnd }
      })
    } else {
      // Return money amounts (default)
      const pvCost = tenantPvKwh * tenantCost.pvCost
      const gridCost = tenantGridKwh * tenantCost.gridCost
      const totalCost = pvCost + gridCost

      return NextResponse.json({
        pvCost: Number(pvCost.toFixed(2)),
        gridCost: Number(gridCost.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        baseFee: Number(tenantCost.baseFee.toFixed(2)),
        currency: tenantCost.currency,
        breakdown: {
          pvConsumption: Number(tenantPvKwh.toFixed(3)),
          gridConsumption: Number(tenantGridKwh.toFixed(3)),
          totalConsumption: Number(tenantConsumptionKwh.toFixed(3)),
          pvRate: tenantCost.pvCost,
          gridRate: tenantCost.gridCost
        },
        timeRange: { start: timeStart, end: timeEnd }
      })
    }

  } catch (error) {
    console.error('Error calculating tenant costs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
