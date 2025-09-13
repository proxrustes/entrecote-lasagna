import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

// GET /api/providers - List all providers
export async function GET(request: NextRequest) {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(providers)

  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/providers - Create new provider
export async function POST(request: NextRequest) {
  try {
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

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Validate energy percentages add up to 100
    const totalPercentage = (nuclearEnergyPct || 0) +
                          (coalEnergyPct || 0) +
                          (gasEnergyPct || 0) +
                          (miscFossilEnergyPct || 0) +
                          (solarEnergyPct || 0) +
                          (windEnergyPct || 0) +
                          (miscRenewableEnergyPct || 0)

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Energy percentages must add up to 100%' },
        { status: 400 }
      )
    }

    const provider = await prisma.provider.create({
      data: {
        name,
        nuclearEnergyPct: nuclearEnergyPct || 0,
        coalEnergyPct: coalEnergyPct || 0,
        gasEnergyPct: gasEnergyPct || 0,
        miscFossilEnergyPct: miscFossilEnergyPct || 0,
        solarEnergyPct: solarEnergyPct || 0,
        windEnergyPct: windEnergyPct || 0,
        miscRenewableEnergyPct: miscRenewableEnergyPct || 0,
      }
    })

    return NextResponse.json(provider, { status: 201 })

  } catch (error) {
    console.error('Error creating provider:', error)

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Provider ID already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}