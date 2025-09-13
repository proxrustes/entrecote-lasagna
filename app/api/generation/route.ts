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
        devices: true
      }
    })

    if (buildings.length === 0) {
      return NextResponse.json([])
    }

    // Extract all device IDs from landlord's buildings
    const deviceIds = buildings.flatMap(building =>
      building.devices.map(device => device.id)
    )

    if (deviceIds.length === 0) {
      return NextResponse.json([])
    }

    // Get PV generation data for all devices in landlord's buildings
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