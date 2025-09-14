import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'

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

    // Security: Get all buildings owned by the landlord
    const buildings = await prisma.building.findMany({
      where: {
        landlordId: landlordId
      },
      include: {
        devices: true,
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

    // Apply buildingId filter if provided
    let filteredBuildings = buildings
    if (buildingId) {
      const landlordBuilding = buildings.find(b => b.id === buildingId)
      if (!landlordBuilding) {
        return NextResponse.json(
          { error: 'Building not found or not owned by this landlord' },
          { status: 403 }
        )
      }
      filteredBuildings = [landlordBuilding]
    }

    // Validate userId if provided
    if (userId) {
      const allValidUserIds = buildings.flatMap(building =>
        building.tenants.map(bt => bt.tenant.id)
      )
      allValidUserIds.push(landlordId) // Include landlord

      if (!allValidUserIds.includes(userId)) {
        return NextResponse.json(
          { error: 'User not found or not accessible by this landlord' },
          { status: 403 }
        )
      }

      // If userId is provided with buildingId, verify user belongs to that building
      if (buildingId) {
        const buildingUserIds = filteredBuildings[0].tenants.map(bt => bt.tenant.id)
        buildingUserIds.push(landlordId)

        if (!buildingUserIds.includes(userId)) {
          return NextResponse.json([])
        }
      }
    }

    // Extract all device IDs from filtered buildings
    const deviceIds = filteredBuildings.flatMap(building =>
      building.devices.map(device => device.id)
    )

    if (deviceIds.length === 0) {
      return NextResponse.json([])
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
    whereConditions.push(`g.timestamp >= $${paramIndex} AND g.timestamp <= $${paramIndex + 1}`)
    params.push(startDateTime, endDateTime)
    paramIndex += 2

    // Add deviceId filter
    if (deviceIds.length > 0) {
      const placeholders = deviceIds.map((_: string, i: number) => `$${paramIndex + i}`).join(', ')
      whereConditions.push(`g."deviceId" IN (${placeholders})`)
      params.push(...deviceIds)
      paramIndex += deviceIds.length
    }

    const whereSQL = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Execute aggregated query
    const aggregatedResults = await prisma.$queryRawUnsafe<Array<{
      deviceId: string
      buildingId: string
      totalKwh: number
      dataPoints: number
      period: Date
    }>>(`
      SELECT
        g."deviceId" as "deviceId",
        d."buildingId" as "buildingId",
        SUM(g."generationKwh") as "totalKwh",
        COUNT(*) as "dataPoints",
        ${dateFormat} as period
      FROM pv_generations g
      JOIN devices d ON g."deviceId" = d.id
      ${whereSQL}
      GROUP BY g."deviceId", d."buildingId", ${dateGroupBy}
      ORDER BY period ASC, g."deviceId"
    `, ...params)

    const formattedData = aggregatedResults.map(result => ({
      timestamp: result.period.toISOString(),
      deviceId: result.deviceId,
      buildingId: result.buildingId,
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
    console.error('Error fetching generation data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}