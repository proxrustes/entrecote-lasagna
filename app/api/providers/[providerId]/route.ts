import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

interface RouteParams {
  params: {
    providerId: string
  }
}

// GET /api/providers/[providerId] - Get specific provider
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { providerId } = params

    const provider = await prisma.provider.findUnique({
      where: {
        id: providerId
      }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(provider)

  } catch (error) {
    console.error('Error fetching provider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/providers/[providerId] - Update provider
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { providerId } = params
    const body = await request.json()
    const {
      name,
      nuclearEnergyPct,
      coalEnergyPct,
      gasEnergyPct,
      miscFossilEnergyPct,
      solarEnergyPct,
      windEnergyPct,
      miscRenewableEnergyPct
    } = body

    // Check if provider exists
    const existingProvider = await prisma.provider.findUnique({
      where: { id: providerId }
    })

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Validate energy percentages if any are provided
    const hasEnergyUpdates = [
      nuclearEnergyPct, coalEnergyPct, gasEnergyPct, miscFossilEnergyPct,
      solarEnergyPct, windEnergyPct, miscRenewableEnergyPct
    ].some(val => val !== undefined)

    if (hasEnergyUpdates) {
      const totalPercentage = (nuclearEnergyPct ?? existingProvider.nuclearEnergyPct) +
                            (coalEnergyPct ?? existingProvider.coalEnergyPct) +
                            (gasEnergyPct ?? existingProvider.gasEnergyPct) +
                            (miscFossilEnergyPct ?? existingProvider.miscFossilEnergyPct) +
                            (solarEnergyPct ?? existingProvider.solarEnergyPct) +
                            (windEnergyPct ?? existingProvider.windEnergyPct) +
                            (miscRenewableEnergyPct ?? existingProvider.miscRenewableEnergyPct)

      if (Math.abs(totalPercentage - 100) > 0.01) {
        return NextResponse.json(
          { error: 'Energy percentages must add up to 100%' },
          { status: 400 }
        )
      }
    }

    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        ...(name && { name }),
        ...(nuclearEnergyPct !== undefined && { nuclearEnergyPct }),
        ...(coalEnergyPct !== undefined && { coalEnergyPct }),
        ...(gasEnergyPct !== undefined && { gasEnergyPct }),
        ...(miscFossilEnergyPct !== undefined && { miscFossilEnergyPct }),
        ...(solarEnergyPct !== undefined && { solarEnergyPct }),
        ...(windEnergyPct !== undefined && { windEnergyPct }),
        ...(miscRenewableEnergyPct !== undefined && { miscRenewableEnergyPct }),
      }
    })

    return NextResponse.json(updatedProvider)

  } catch (error) {
    console.error('Error updating provider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/providers/[providerId] - Delete provider
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;  try {

    // Check if provider exists and is in use
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        buildings: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Prevent deletion if provider has buildings
    if (provider.buildings.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete provider. It is currently used by ${provider.buildings.length} building(s)`,
          buildingsCount: provider.buildings.length
        },
        { status: 409 }
      )
    }

    await prisma.provider.delete({
      where: { id: providerId }
    })

    return NextResponse.json(
      { message: 'Provider deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}