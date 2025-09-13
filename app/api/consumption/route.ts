import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const landlordId = searchParams.get('landlordId')
    const userId = searchParams.get('userId')
    const buildingId = searchParams.get('buildingId')
    const aggregation = searchParams.get('aggregation') || 'hour' // hour, day, raw

    if (!landlordId) {
      return NextResponse.json(
        { error: 'landlordId is required' },
        { status: 400 }
      )
    }

    // Build query conditions
    const whereClause: any = {}

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
      const landlordBuilding = buildings.find(b => b.id === buildingId)
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

    // Get consumption data based on aggregation level
    let formattedData: any[] = []

    if (aggregation === 'raw') {
      // Raw data - limit to 1000 records to avoid 5MB limit
      const consumptions = await prisma.consumption.findMany({
        where: whereClause,
        include: {
          user: {
            select: { name: true, type: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000 // Limit to prevent 5MB error
      })

      formattedData = consumptions.map(c => ({
        timestamp: c.timestamp.toISOString(),
        userId: c.userId,
        userName: c.user.name,
        kWh: c.consumptionKwh
      }))

    } else {
      // Aggregated data using Prisma's aggregation instead of raw SQL
      if (aggregation === 'day') {
        // Daily aggregation using Prisma groupBy
        const aggregatedData = await prisma.consumption.groupBy({
          by: ['userId'],
          where: whereClause,
          _sum: {
            consumptionKwh: true,
          },
          _count: {
            _all: true,
          },
        })

        // Get user names
        const userNames = await prisma.user.findMany({
          where: {
            id: { in: aggregatedData.map(d => d.userId) }
          },
          select: { id: true, name: true }
        })

        const userNameMap = Object.fromEntries(userNames.map(u => [u.id, u.name]))

        formattedData = aggregatedData.map(row => ({
          timestamp: new Date().toISOString(), // For daily, we use today's date
          userId: row.userId,
          userName: userNameMap[row.userId] || 'Unknown',
          kWh: Number((row._sum.consumptionKwh || 0).toFixed(3)),
          dataPoints: row._count._all,
          aggregation: 'day'
        }))
      } else {
        // Hourly aggregation with simplified approach
        const consumptions = await prisma.consumption.findMany({
          where: whereClause,
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { timestamp: 'asc' }
        })

        // Group by hour and user manually
        const hourlyGroups = new Map<string, {
          userId: string,
          userName: string,
          totalKwh: number,
          count: number,
          hour: Date
        }>()

        consumptions.forEach(c => {
          const hour = new Date(c.timestamp)
          hour.setMinutes(0, 0, 0)
          const key = `${c.userId}-${hour.toISOString()}`

          if (!hourlyGroups.has(key)) {
            hourlyGroups.set(key, {
              userId: c.userId,
              userName: c.user.name,
              totalKwh: 0,
              count: 0,
              hour
            })
          }

          const group = hourlyGroups.get(key)!
          group.totalKwh += c.consumptionKwh
          group.count += 1
        })

        formattedData = Array.from(hourlyGroups.values()).map(group => ({
          timestamp: group.hour.toISOString(),
          userId: group.userId,
          userName: group.userName,
          kWh: Number(group.totalKwh.toFixed(3)),
          dataPoints: group.count,
          aggregation: 'hour'
        })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      }
    }

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