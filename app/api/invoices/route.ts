import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'
import puppeteer from 'puppeteer'
import { generateInvoiceHTML, type InvoiceData } from './invoice-template'
import { allocateTenantEnergy } from '@/lib/energy/allocation'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Build where clause for filtering
    const where: any = {}
    if (userId) {
      where.userId = userId
    }

    // Return invoice list/metadata only
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            address: true,
            contractId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Return invoices without PDF binary data (too large for JSON)
    const invoicesResponse = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      userId: invoice.userId,
      user: invoice.user,
      startDate: invoice.startDate,
      endDate: invoice.endDate,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      consumptionKwh: invoice.consumptionKwh,
      gridCost: invoice.gridCost,
      baseFee: invoice.baseFee,
      dataPoints: invoice.dataPoints,
      filename: invoice.filename,
      generatedAt: invoice.generatedAt,
      createdAt: invoice.createdAt,
      pdfSize: invoice.pdfData.length
    }))

    return NextResponse.json({
      message: 'Invoices retrieved successfully',
      count: invoices.length,
      invoices: invoicesResponse
    })

  } catch (error) {
    console.error('Error retrieving invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const body = await request.json()

    const {
      userId,
      startDate,
      endDate,
      landlordId
    } = body

    // Validation
    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'userId, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    // Security check: Verify landlord has access to this user
    if (landlordId) {
      const userBuilding = await prisma.buildingTenant.findFirst({
        where: {
          tenantId: userId,
          building: {
            landlordId: landlordId
          }
        },
        include: {
          building: true,
          tenant: true
        }
      })

      if (!userBuilding) {
        return NextResponse.json(
          { error: 'User not accessible by this landlord' },
          { status: 403 }
        )
      }
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantBuildings: {
          include: {
            building: true
          }
        },
        costs: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get consumption data for the time period
    const startDateTime = new Date(startDate)
    const endDateTime = new Date(endDate)

    const consumptions = await prisma.consumption.findMany({
      where: {
        userId: userId,
        timestamp: { gte: startDateTime, lte: endDateTime }
      },
      orderBy: { timestamp: 'asc' }
    })

    // Determine building context for PV and other tenants' consumption
    const buildingRef = user.tenantBuildings[0]?.building
    if (!buildingRef) {
      return NextResponse.json(
        { error: 'User has no building association' },
        { status: 400 }
      )
    }

    // Collect all users in this building (tenants + landlord) for interval allocation
    const buildingFull = await prisma.building.findUnique({
      where: { id: buildingRef.id },
      include: { tenants: true }
    })

    const buildingTenantIds = (buildingFull?.tenants || []).map(bt => bt.tenantId)
    const allUserIds = [...buildingTenantIds, buildingRef.landlordId]

    const allConsumptions = await prisma.consumption.findMany({
      where: {
        userId: { in: allUserIds },
        timestamp: { gte: startDateTime, lte: endDateTime }
      },
      orderBy: { timestamp: 'asc' }
    })

    const pvGenerations = await prisma.pvGeneration.findMany({
      where: {
        device: { buildingId: buildingRef.id },
        timestamp: { gte: startDateTime, lte: endDateTime }
      },
      orderBy: { timestamp: 'asc' }
    })

    const alloc = allocateTenantEnergy(consumptions, allConsumptions, pvGenerations)
    const totalGridKwh = alloc.gridKwh
    const totalPvKwh = alloc.pvKwh
    const totalConsumptionKwh = alloc.totalKwh

    // Get user's cost rates
    const userCost = user.costs[0] // Assuming one cost record per user

    if (!userCost) {
      return NextResponse.json(
        { error: 'Cost information not found for user' },
        { status: 404 }
      )
    }

    // Calculate costs for grid and PV separately
    const totalGridCost = totalGridKwh * userCost.gridCost
    const totalPvCost = totalPvKwh * userCost.pvCost
    const totalBaseFee = userCost.baseFee
    const totalAmount = totalGridCost + totalPvCost + totalBaseFee

    // Invoice data structure
    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        address: user.address,
        contractId: user.contractId
      },
      provider: {
        name: 'RoofShare Energy GmbH',
        address: 'Musterstraße 123<br>10115 Berlin<br>Deutschland'
      },
      building: user.tenantBuildings[0]?.building,
      period: {
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString()
      },
      consumption: {
        gridKwh: Number(totalGridKwh.toFixed(3)),
        pvKwh: Number(totalPvKwh.toFixed(3)),
        totalKwh: Number(totalConsumptionKwh.toFixed(3)),
        dataPoints: consumptions.length
      },
      costs: {
        gridCost: Number(totalGridCost.toFixed(2)),
        pvCost: Number(totalPvCost.toFixed(2)),
        baseFee: Number(totalBaseFee.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        currency: userCost.currency,
        rates: {
          gridRate: userCost.gridCost,
          pvRate: userCost.pvCost
        }
      },
      generatedAt: new Date().toISOString()
    }

    // Generate PDF from HTML template
    const htmlContent = generateInvoiceHTML(invoiceData)

    let browser
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })

      await browser.close()

      // Save invoice to database
      const savedInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invoiceData.invoiceNumber,
          userId: invoiceData.user.id,
          startDate: startDateTime,
          endDate: endDateTime,
          totalAmount: invoiceData.costs.totalAmount,
          currency: invoiceData.costs.currency,
          consumptionKwh: invoiceData.consumption.totalKwh,
          gridCost: invoiceData.costs.gridCost,
          baseFee: invoiceData.costs.baseFee,
          dataPoints: invoiceData.consumption.dataPoints,
          pdfData: pdfBuffer,
          filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
          generatedAt: new Date(invoiceData.generatedAt)
        }
      })

      // For testing, still return the PDF as base64
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

      return NextResponse.json({
        message: 'Invoice generated and saved successfully',
        invoiceData,
        savedInvoice: {
          id: savedInvoice.id,
          invoiceNumber: savedInvoice.invoiceNumber,
          filename: savedInvoice.filename
        },
        pdf: {
          filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
          size: pdfBuffer.length,
          base64: pdfBase64 // Remove this in production, only for testing
        }
      })

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError)
      if (browser) await browser.close()

      return NextResponse.json({
        message: 'Invoice data generated, but PDF generation failed',
        invoiceData,
        error: 'PDF generation failed'
      }, { status: 206 }) // 206 Partial Content
    }

  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
