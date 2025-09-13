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

    // Get PV generation data for devices in filtered buildings
    const generations = await prisma.pvGeneration.findMany({
      where: {
        deviceId: {
          in: deviceIds
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

    // Format response
    const formattedData = generations.map(generation => ({
      timestamp: generation.timestamp.toISOString(),
      deviceId: generation.deviceId,
      buildingId: generation.device.building.id,
      kWh: generation.generationKwh
    }))

    // Note: userId filter doesn't directly apply to PV generation
    // because generation is building/device-level, not user-level
    // Frontend can filter by user consumption vs building generation as needed
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