import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId parameter is required' },
        { status: 400 }
      )
    }

    // Find the invoice with PDF data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Return PDF as file download
    return new NextResponse(invoice.pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.filename}"`,
        'Content-Length': invoice.pdfData.length.toString(),
        'Cache-Control': 'private, max-age=3600' // Cache for 1 hour
      }
    })

  } catch (error) {
    console.error('Error downloading invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}