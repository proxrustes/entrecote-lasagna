import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const landlordId = searchParams.get('landlordId')
    const userId = searchParams.get('userId')
    const buildingId = searchParams.get('buildingId')

    if (!landlordId) {
      return NextResponse.json(
        { error: 'landlordId is required' },
        { status: 400 }
      )
    }

    // Build query conditions
    let whereClause: any = {}

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
      let buildingUserIds = landlordBuilding.tenants.map(bt => bt.tenant.id)
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

    // Get consumption data
    const consumptions = await prisma.consumption.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            tenantBuildings: {
              include: {
                building: true
              }
            },
            ownedBuildings: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Format response with building information
    const formattedData = consumptions.map(consumption => {
      // Find which building this user belongs to
      let responseBuildingId = ''

      if (consumption.user.type === 'LANDLORD') {
        // For landlord, find which building this consumption belongs to
        if (buildingId) {
          responseBuildingId = buildingId
        } else {
          // Use first owned building as default
          responseBuildingId = consumption.user.ownedBuildings[0]?.id || ''
        }
      } else {
        // For tenant, find their building
        const tenantBuilding = consumption.user.tenantBuildings[0]
        responseBuildingId = tenantBuilding?.building.id || ''
      }

      return {
        timestamp: consumption.timestamp.toISOString(),
        userId: consumption.userId,
        buildingId: responseBuildingId,
        kWh: consumption.consumptionKwh
      }
    })

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