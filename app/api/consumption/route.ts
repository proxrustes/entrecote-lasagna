import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const landlordId = searchParams.get('landlordId')

    if (!landlordId) {
      return NextResponse.json(
        { error: 'landlordId is required' },
        { status: 400 }
      )
    }

    // Get all buildings owned by the landlord
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

    // Extract all tenant IDs and include landlord ID
    const userIds = buildings.flatMap(building =>
      building.tenants.map(bt => bt.tenant.id)
    )
    userIds.push(landlordId) // Include landlord's general consumption

    // Get consumption data for all users in landlord's buildings
    const consumptions = await prisma.consumption.findMany({
      where: {
        userId: {
          in: userIds
        }
      },
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
      let buildingId = ''

      if (consumption.user.type === 'LANDLORD') {
        // For landlord, use first owned building (general consumption)
        buildingId = consumption.user.ownedBuildings[0]?.id || ''
      } else {
        // For tenant, find their building
        const tenantBuilding = consumption.user.tenantBuildings[0]
        buildingId = tenantBuilding?.building.id || ''
      }

      return {
        timestamp: consumption.timestamp.toISOString(),
        userId: consumption.userId,
        buildingId: buildingId,
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