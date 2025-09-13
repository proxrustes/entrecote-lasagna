import { PrismaClient, UserType } from '@/app/generated/prisma'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  const buildingAddress = 'Musterstraße 1, 12345 Berlin'

  // 1. Create mock providers
  const providers = await Promise.all([
    prisma.provider.upsert({
      where: { providerId: 'PROVIDER_1' },
      update: {},
      create: {
        providerId: 'PROVIDER_1',
        name: 'Green Energy GmbH',
        windEnergyPct: 40.0,
        solarEnergyPct: 50.0,
        nuclearEnergyPct: 10.0,
      },
    }),
    prisma.provider.upsert({
      where: { providerId: 'PROVIDER_2' },
      update: {},
      create: {
        providerId: 'PROVIDER_2',
        name: 'Clean Power AG',
        windEnergyPct: 60.0,
        solarEnergyPct: 30.0,
        nuclearEnergyPct: 10.0,
      },
    }),
    prisma.provider.upsert({
      where: { providerId: 'PROVIDER_3' },
      update: {},
      create: {
        providerId: 'PROVIDER_3',
        name: 'Solar Solutions Ltd',
        windEnergyPct: 20.0,
        solarEnergyPct: 70.0,
        nuclearEnergyPct: 10.0,
      },
    }),
  ])

  // 2. Create mock landlord
  const landlord = await prisma.user.upsert({
    where: { id: 'LANDLORD_1' },
    update: {},
    create: {
      id: 'LANDLORD_1',
      name: 'Landlord Schmidt',
      address: buildingAddress,
      iban: 'DE89370400440532013000',
      type: UserType.LANDLORD,
    },
  })

  // 3. Create landlord authentication
  await prisma.authentication.upsert({
    where: { email: 'landlord@roofshare.de' },
    update: {},
    create: {
      email: 'landlord@roofshare.de',
      password: 'password123',
      userId: landlord.id,
    },
  })

  // 4. Create mock building
  const building = await Promise.all([
    prisma.building.upsert({
      where: { buildingId: 'BUILDING_1' },
      update: {},
      create: {
        buildingId: 'BUILDING_1',
        address: buildingAddress,
        landlordId: landlord.id,
        providerId: providers[0].id,
      },
    }),
    prisma.building.upsert({
      where: { buildingId: 'BUILDING_2' },
      update: {},
      create: {
        buildingId: 'BUILDING_2',
        address: buildingAddress,
        landlordId: landlord.id,
        providerId: providers[0].id,
      },
    })
  ])

  // 5. Create settlement from CSV
  const landlordPath = path.join(__dirname, 'data', 'landlord_settlement.csv')
  const landlordData = fs.readFileSync(landlordPath, 'utf-8')
  const landlordLines = landlordData.split('\n').filter(line => line.trim()).slice(1)

  const [, gridCost, feedingPrice] = landlordLines[0].split(',').map(field => field.trim())

  await prisma.settlement.upsert({
    where: { buildingId: building[0].id },
    update: {},
    create: {
      gridCost: parseFloat(gridCost),
      feedingPrice: parseFloat(feedingPrice),
      currency: 'EUR',
      buildingId: building[0].id,
    },
  })

  // 6. Create mock devices
  const devices = await Promise.all([
    prisma.device.upsert({
      where: { deviceId: 'PV_DEVICE_1' },
      update: {},
      create: {
        deviceId: 'PV_DEVICE_1',
        status: 'active',
        buildingId: building[0].id,
      },
    }),
    prisma.device.upsert({
      where: { deviceId: 'PV_DEVICE_2' },
      update: {},
      create: {
        deviceId: 'PV_DEVICE_2',
        status: 'active',
        buildingId: building[0].id,
      },
    }),
  ])

  // 7. Read tenant contracts and create users
  const contractsPath = path.join(__dirname, 'data', 'contracts_yearly.csv')
  const contractsData = fs.readFileSync(contractsPath, 'utf-8')
  const contractLines = contractsData.split('\n').filter(line => line.trim()).slice(1)

  const tenants = []
  for (let i = 0; i < contractLines.length; i++) {
    const [contractId, tenantName] = contractLines[i].split(',').map(field => field.trim())

    const email = `tenant${i + 1}@roofshare.de`
    const mockIban = `DE89370400440532${String(i + 1).padStart(6, '0')}`

    // Create tenant user
    const tenant = await prisma.user.upsert({
      where: { id: contractId },
      update: {},
      create: {
        id: contractId,
        name: tenantName,
        address: buildingAddress,
        iban: mockIban,
        type: UserType.TENANT,
        contractId: contractId,
      },
    })
    tenants.push(tenant)

    // Create tenant authentication
    await prisma.authentication.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: 'password123',
        userId: tenant.id,
      },
    })

    // Link tenant to building
    await prisma.buildingTenant.upsert({
      where: {
        buildingId_tenantId: {
          buildingId: building[0].id,
          tenantId: tenant.id,
        },
      },
      update: {},
      create: {
        buildingId: building[0].id,
        tenantId: tenant.id,
      },
    })
  }

  // 8. Create costs from tenant_tariffs.csv
  const tariffsPath = path.join(__dirname, 'data', 'tenant_tariffs.csv')
  const tariffsData = fs.readFileSync(tariffsPath, 'utf-8')
  const tariffLines = tariffsData.split('\n').filter(line => line.trim()).slice(1)

  const [, , pvPrice, gridPrice, baseFee] = tariffLines[0].split(',').map(field => field.trim())

  for (const tenant of tenants) {
    await prisma.cost.create({
      data: {
        userId: tenant.id,
        pvCost: parseFloat(pvPrice),
        gridCost: parseFloat(gridPrice),
        baseFee: parseFloat(baseFee),
        currency: 'EUR',
      },
    })
  }

  // 9. Seed consumption and PV generation from hackathon dataset
  const datasetPath = path.join(__dirname, 'data', 'hackathon_dataset_prepared_CORRECTED.csv')
  const datasetData = fs.readFileSync(datasetPath, 'utf-8')
  const datasetLines = datasetData.split('\n').filter(line => line.trim()).slice(1).slice(0, 100) // Limit to first 100 rows for testing

  for (const line of datasetLines) {
    const [timestamp, we1Consumption, we2Consumption, generalConsumption, , pvGeneration] = line.split(',').map(field => field.trim())

    if (!timestamp) continue

    const parsedTimestamp = new Date(timestamp)

    // Create consumption records
    if (we1Consumption && parseFloat(we1Consumption) > 0) {
      await prisma.consumption.create({
        data: {
          timestamp: parsedTimestamp,
          consumptionKwh: parseFloat(we1Consumption),
          userId: tenants[0].id, // we1 = first tenant
        }
      })
    }

    if (we2Consumption && parseFloat(we2Consumption) > 0) {
      await prisma.consumption.create({
        data: {
          timestamp: parsedTimestamp,
          consumptionKwh: parseFloat(we2Consumption),
          userId: tenants[1] ? tenants[1].id : tenants[0].id, // we2 = second tenant or first if only one
        }
      })
    }

    if (generalConsumption && parseFloat(generalConsumption) > 0) {
      await prisma.consumption.create({
        data: {
          timestamp: parsedTimestamp,
          consumptionKwh: parseFloat(generalConsumption),
          userId: landlord.id, // general consumption linked to landlord
        }
      })
    }

    // Create PV generation records
    if (pvGeneration && parseFloat(pvGeneration) > 0) {
      await prisma.pvGeneration.create({
        data: {
          timestamp: parsedTimestamp,
          generationKwh: parseFloat(pvGeneration),
          deviceId: devices[0].id, // Use first PV device
        }
      })
    }
  }

  console.log(`✅ Seeded ${tenants.length} tenants, 1 landlord, 1 building, ${providers.length} providers, ${devices.length} devices, and consumption/generation data`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})