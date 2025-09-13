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
      const landlordBuilding = buildings.find(b => b.buildingId === buildingId)
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

    // Get PV generation data for devices in filtered buildings with time filter
    const generations = await prisma.pvGeneration.findMany({
      where: {
        deviceId: {
          in: deviceIds
        },
        timestamp: {
          gte: startDateTime,
          lte: endDateTime
        }
      },
      include: {
        device: {
          include: {
            building: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Group by aggregation unit, device and building
    const groups = new Map<string, {
      deviceId: string,
      buildingId: string,
      totalKwh: number,
      count: number,
      period: Date
    }>()

    generations.forEach(g => {
      let period: Date

      if (aggregationUnit === 'hour') {
        period = new Date(g.timestamp)
        period.setMinutes(0, 0, 0)
      } else {
        // Daily aggregation
        period = new Date(g.timestamp)
        period.setHours(0, 0, 0, 0)
      }

      const key = `${g.deviceId}-${period.toISOString()}`

      if (!groups.has(key)) {
        groups.set(key, {
          deviceId: g.deviceId,
          buildingId: g.device.building.id,
          totalKwh: 0,
          count: 0,
          period
        })
      }

      const group = groups.get(key)!
      group.totalKwh += g.generationKwh
      group.count += 1
    })

    const formattedData = Array.from(groups.values()).map(group => ({
      timestamp: group.period.toISOString(),
      deviceId: group.deviceId,
      buildingId: group.buildingId,
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
    console.error('Error fetching generation data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}