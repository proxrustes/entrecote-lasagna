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
    const whereClause: {
      timestamp: { gte: Date; lte: Date }
      userId?: string | { in: string[] }
    } = {
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

    // Use database-level aggregation with raw SQL for better performance
    let dateFormat: string
    let dateGroupBy: string

    if (aggregationUnit === 'hour') {
      // Group by hour - PostgreSQL syntax
      dateFormat = `DATE_TRUNC('hour', timestamp)`
      dateGroupBy = `DATE_TRUNC('hour', timestamp)`
    } else {
      // Group by day - PostgreSQL syntax
      dateFormat = `DATE_TRUNC('day', timestamp)`
      dateGroupBy = `DATE_TRUNC('day', timestamp)`
    }

    // Build WHERE conditions for raw query
    const params: (string | Date)[] = []
    const whereConditions: string[] = []
    let paramIndex = 1

    // Add timestamp range
    whereConditions.push(`timestamp >= $${paramIndex} AND timestamp <= $${paramIndex + 1}`)
    params.push(startDateTime, endDateTime)
    paramIndex += 2

    // Add userId filter
    if (whereClause.userId) {
      if (typeof whereClause.userId === 'string') {
        whereConditions.push(`c."userId" = $${paramIndex}`)
        params.push(whereClause.userId)
        paramIndex += 1
      } else if (whereClause.userId.in) {
        const placeholders = whereClause.userId.in.map((_: string, i: number) => `$${paramIndex + i}`).join(', ')
        whereConditions.push(`c."userId" IN (${placeholders})`)
        params.push(...whereClause.userId.in)
        paramIndex += whereClause.userId.in.length
      }
    }

    const whereSQL = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Execute aggregated query
    const aggregatedResults = await prisma.$queryRawUnsafe<Array<{
      userId: string
      userName: string
      totalKwh: number
      dataPoints: number
      period: Date
    }>>(`
      SELECT
        c."userId" as "userId",
        u.name as "userName",
        SUM(c."consumptionKwh") as "totalKwh",
        COUNT(*) as "dataPoints",
        ${dateFormat} as period
      FROM consumptions c
      JOIN users u ON c."userId" = u.id
      ${whereSQL}
      GROUP BY c."userId", u.name, ${dateGroupBy}
      ORDER BY period ASC, c."userId"
    `, ...params)

    const formattedData = aggregatedResults.map(result => ({
      timestamp: result.period.toISOString(),
      userId: result.userId,
      userName: result.userName,
      kWh: Number(Number(result.totalKwh).toFixed(3)),
      dataPoints: Number(result.dataPoints),
      period: period,
      aggregation: aggregationUnit,
      timeRange: {
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      }
    }))

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