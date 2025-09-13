import { PrismaClient, UserRole } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database for RoofShare solar energy app...')

  // Create sample tenants
  const tenant1 = await prisma.user.upsert({
    where: { email: 'mieter-eg-rechts@roofshare.de' },
    update: {},
    create: {
      email: 'mieter-eg-rechts@roofshare.de',
      password: 'demo_password_123',
      role: UserRole.TENANT,
    },
  })

  const tenant2 = await prisma.user.upsert({
    where: { email: 'mieter-eg-links@roofshare.de' },
    update: {},
    create: {
      email: 'mieter-eg-links@roofshare.de',
      password: 'demo_password_456',
      role: UserRole.TENANT,
    },
  })

  // Create sample landlord
  const landlord = await prisma.user.upsert({
    where: { email: 'vermieter@roofshare.de' },
    update: {},
    create: {
      email: 'vermieter@roofshare.de',
      password: 'demo_password_789',
      role: UserRole.LANDLORD,
    },
  })

  // Create tariff
  const tariff = await prisma.tariff.upsert({
    where: { name: 'TENANT_T1' },
    update: {},
    create: {
      name: 'TENANT_T1',
      model: 'two_price',
      pvPricePerKwh: 0.26,
      gridPricePerKwh: 0.3351,
      baseFeePerMonth: 10.0,
      currency: 'EUR',
      validFrom: new Date('2025-08-01'),
    },
  })

  // Create settlement model
  const settlement = await prisma.settlement.upsert({
    where: { name: 'LANDLORD_S1' },
    update: {},
    create: {
      name: 'LANDLORD_S1',
      gridCostPerKwh: 0.3351,
      feedInPricePerKwh: 0.08,
      currency: 'EUR',
      validFrom: new Date('2025-08-01'),
    },
  })

  // Create sample PV generation data
  const baseDate = new Date('2025-08-04T15:00:00Z')
  for (let i = 0; i < 10; i++) {
    await prisma.pvGeneration.create({
      data: {
        timestamp: new Date(baseDate.getTime() + i * 15 * 60 * 1000),
        generationKwh: Math.random() * 2.5,
        meterId: 'pv_meter_001',
      },
    })
  }

  // Create sample consumption data for tenant 1
  for (let i = 0; i < 10; i++) {
    await prisma.consumption.create({
      data: {
        timestamp: new Date(baseDate.getTime() + i * 15 * 60 * 1000),
        consumptionKwh: Math.random() * 0.5,
        meterColumn: 'we1_consumption_kWh',
        userId: tenant1.id,
        tariffId: tariff.id,
      },
    })
  }

  // Create sample consumption data for tenant 2
  for (let i = 0; i < 10; i++) {
    await prisma.consumption.create({
      data: {
        timestamp: new Date(baseDate.getTime() + i * 15 * 60 * 1000),
        consumptionKwh: Math.random() * 0.4,
        meterColumn: 'we2_consumption_kWh',
        userId: tenant2.id,
        tariffId: tariff.id,
      },
    })
  }

  // Create contracts
  const contract1 = await prisma.contract.upsert({
    where: { contractId: 'CUST_WE1_2025' },
    update: {},
    create: {
      contractId: 'CUST_WE1_2025',
      tenantName: 'Mieter EG rechts',
      meterColumn: 'we1_consumption_kWh',
      contractStart: new Date('2025-08-01'),
      billingCycle: 'yearly',
      baseFeeShare: 1,
      userId: tenant1.id,
      tariffId: tariff.id,
    },
  })

  const contract2 = await prisma.contract.upsert({
    where: { contractId: 'CUST_WE2_2025' },
    update: {},
    create: {
      contractId: 'CUST_WE2_2025',
      tenantName: 'Mieter EG links',
      meterColumn: 'we2_consumption_kWh',
      contractStart: new Date('2025-08-01'),
      billingCycle: 'yearly',
      baseFeeShare: 1,
      userId: tenant2.id,
      tariffId: tariff.id,
    },
  })

  // Create sample grid flow data
  for (let i = 0; i < 10; i++) {
    await prisma.gridFlow.create({
      data: {
        timestamp: new Date(baseDate.getTime() + i * 15 * 60 * 1000),
        importKwh: Math.random() * 0.1,
        exportKwh: Math.random() * 1.5,
      },
    })
  }

  console.log('Created users:', { tenant1: tenant1.email, tenant2: tenant2.email, landlord: landlord.email })
  console.log('Created tariff:', tariff.name)
  console.log('Created settlement:', settlement.name)
  console.log('Created contracts:', { contract1: contract1.contractId, contract2: contract2.contractId })
  console.log('Created 10 PV generation readings')
  console.log('Created 10 grid flow readings')
  console.log('Created 20 consumption readings')
  console.log('Database seeding completed')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })