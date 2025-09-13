import { PrismaClient, UserRole } from '../app/generated/prisma'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Read tenant contracts
  const contractsPath = path.join(__dirname, 'data', 'contracts_yearly.csv')
  const contractsData = fs.readFileSync(contractsPath, 'utf-8')
  const contractLines = contractsData.split('\n').filter(line => line.trim()).slice(1)

  // Create tenants from contracts
  for (const line of contractLines) {
    const [contractId, tenantName] = line.split(',').map(field => field.trim())

    const email = `${tenantName.toLowerCase().replace(/\s+/g, '-')}@roofshare.de`

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: contractId,
        email,
        password: 'demo_password_123',
        role: UserRole.TENANT,
      },
    })
  }

  // Read landlord settlement
  const landlordPath = path.join(__dirname, 'data', 'landlord_settlement.csv')
  const landlordData = fs.readFileSync(landlordPath, 'utf-8')
  const landlordLines = landlordData.split('\n').filter(line => line.trim()).slice(1)

  // Create landlord
  for (const line of landlordLines) {
    const [settlementId] = line.split(',').map(field => field.trim())

    await prisma.user.upsert({
      where: { email: 'landlord@roofshare.de' },
      update: {},
      create: {
        id: settlementId,
        email: 'landlord@roofshare.de',
        password: 'demo_password_456',
        role: UserRole.LANDLORD,
      },
    })
  }

  console.log(`✅ Seeded ${contractLines.length} tenants and ${landlordLines.length} landlord`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})