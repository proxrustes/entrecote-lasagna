import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get tenant's building and landlord info
    const tenant = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantBuildings: {
          include: {
            building: {
              select: {
                landlordId: true
              }
            }
          }
        }
      }
    })

    if (!tenant || tenant.tenantBuildings.length === 0) {
      return NextResponse.json(
        { error: 'Tenant or building not found' },
        { status: 404 }
      )
    }

    const landlordId = tenant.tenantBuildings[0].building.landlordId

    return NextResponse.json({
      landlordId
    })

  } catch (error) {
    console.error('Error getting tenant landlord:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}