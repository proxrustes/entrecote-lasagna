import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const landlordId = searchParams.get('landlordId')
    const userId = searchParams.get('userId')
    const buildingId = searchParams.get('buildingId')
    const period = searchParams.get('period') || '1day' // 1day, 1week, 1month, 1year
    const endDate = searchParams.get('endDate') // ISO string, defaults to now

    // Calculate time range based on period and endDate
    const endDateTime = endDate ? new Date(endDate) : new Date()
    let startDateTime: Date
    let aggregationUnit: 'hour' | 'day'

    switch (period) {
      case '1day':
        startDateTime = new Date(endDateTime.getTime() - 24 * 60 * 60 * 1000)
        aggregationUnit = 'hour'
        break
      case '1week':
        startDateTime = new Date(endDateTime.getTime() - 7 * 24 * 60 * 60 * 1000)
        aggregationUnit = 'hour'
        break
      case '1month':
        startDateTime = new Date(endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000)
        aggregationUnit = 'day'
        break
      case '1year':
        startDateTime = new Date(endDateTime.getTime() - 365 * 24 * 60 * 60 * 1000)
        aggregationUnit = 'day'
        break
      default:
        startDateTime = new Date(endDateTime.getTime() - 24 * 60 * 60 * 1000)
        aggregationUnit = 'hour'
    }

    if (!landlordId) {
      return NextResponse.json(
        { error: 'landlordId is required' },
        { status: 400 }
      )
    }

    // Build query conditions with time range
    const whereClause: any = {
      timestamp: {
        gte: startDateTime,
        lte: endDateTime
      }
    }

    // Security: Always filter by landlord's data first
    const buildings = await prisma.building.findMany({
      where: {
        landlordId: landlordId
      },
      include: {
        tenants: {
          include: {
            tenant: true
          }
        }
      }
    })

    if (buildings.length === 0) {
      return NextResponse.json([])
    }

    // Get all valid user IDs for this landlord
    const validUserIds = buildings.flatMap(building =>
      building.tenants.map(bt => bt.tenant.id)
    )
    validUserIds.push(landlordId) // Include landlord's general consumption

    // Apply userId filter if provided
    if (userId) {
      if (!validUserIds.includes(userId)) {
        return NextResponse.json(
          { error: 'User not found or not accessible by this landlord' },
          { status: 403 }
        )
      }
      whereClause.userId = userId
    } else {
      whereClause.userId = {
        in: validUserIds
      }
    }

    // Apply buildingId filter if provided
    if (buildingId) {
      const landlordBuilding = buildings.find(b => b.buildingId === buildingId)
      if (!landlordBuilding) {
        return NextResponse.json(
          { error: 'Building not found or not owned by this landlord' },
          { status: 403 }
        )
      }

      // Filter users by building
      const buildingUserIds = landlordBuilding.tenants.map(bt => bt.tenant.id)
      buildingUserIds.push(landlordId) // Include landlord for this building

      if (userId) {
        // If userId is also specified, ensure it's in this building
        if (!buildingUserIds.includes(userId)) {
          return NextResponse.json([])
        }
      } else {
        // Filter by building users
        whereClause.userId = {
          in: buildingUserIds
        }
      }
    }

    // Get consumption data based on aggregation unit
    const consumptions = await prisma.consumption.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { timestamp: 'asc' }
    })

    // Group by aggregation unit and user
    const groups = new Map<string, {
      userId: string,
      userName: string,
      totalKwh: number,
      count: number,
      period: Date
    }>()

    consumptions.forEach(c => {
      let period: Date

      if (aggregationUnit === 'hour') {
        period = new Date(c.timestamp)
        period.setMinutes(0, 0, 0)
      } else {
        // Daily aggregation
        period = new Date(c.timestamp)
        period.setHours(0, 0, 0, 0)
      }

      const key = `${c.userId}-${period.toISOString()}`

      if (!groups.has(key)) {
        groups.set(key, {
          userId: c.userId,
          userName: c.user.name,
          totalKwh: 0,
          count: 0,
          period
        })
      }

      const group = groups.get(key)!
      group.totalKwh += c.consumptionKwh
      group.count += 1
    })

    const formattedData = Array.from(groups.values()).map(group => ({
      timestamp: group.period.toISOString(),
      userId: group.userId,
      userName: group.userName,
      kWh: Number(group.totalKwh.toFixed(3)),
      dataPoints: group.count,
      period: period,
      aggregation: aggregationUnit,
      timeRange: {
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      }
    })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return NextResponse.json(formattedData)

  } catch (error) {
    console.error('Error fetching consumption data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}