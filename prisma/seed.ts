import { PrismaClient, UserType } from '@/app/generated/prisma'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  const buildingAddresses = [
    'Musterstraße 1, 12345 Berlin',
    'Sonnenallee 42, 10999 Berlin'
  ]

  // 1. Create mock providers (delete existing first to avoid duplicates)
  await prisma.provider.deleteMany({
    where: {
      name: { in: ['Green Energy GmbH', 'Clean Power AG', 'Solar Solutions Ltd'] }
    }
  })

  const providers = await Promise.all([
    prisma.provider.create({
      data: {
        name: 'Green Energy GmbH',
        windEnergyPct: 40.0,
        solarEnergyPct: 35.0,
        miscRenewableEnergyPct: 15.0,
        nuclearEnergyPct: 10.0,
        coalEnergyPct: 0.0,
        gasEnergyPct: 0.0,
        miscFossilEnergyPct: 0.0,
      },
    }),
    prisma.provider.create({
      data: {
        name: 'Clean Power AG',
        windEnergyPct: 45.0,
        solarEnergyPct: 25.0,
        miscRenewableEnergyPct: 10.0,
        nuclearEnergyPct: 20.0,
        coalEnergyPct: 0.0,
        gasEnergyPct: 0.0,
        miscFossilEnergyPct: 0.0,
      },
    }),
    prisma.provider.create({
      data: {
        name: 'Solar Solutions Ltd',
        windEnergyPct: 15.0,
        solarEnergyPct: 60.0,
        miscRenewableEnergyPct: 5.0,
        nuclearEnergyPct: 0.0,
        coalEnergyPct: 10.0,
        gasEnergyPct: 10.0,
        miscFossilEnergyPct: 0.0,
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
      address: buildingAddresses[0],
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
        address: buildingAddresses[0],
        landlordId: landlord.id,
        providerId: providers[0].id,
      },
    }),
    prisma.building.upsert({
      where: { buildingId: 'BUILDING_2' },
      update: {},
      create: {
        buildingId: 'BUILDING_2',
        address: buildingAddresses[1],
        landlordId: landlord.id,
        providerId: providers[1].id,
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

  // 6. Create mock devices (distribute across buildings)
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
    prisma.device.upsert({
      where: { deviceId: 'PV_DEVICE_3' },
      update: {},
      create: {
        deviceId: 'PV_DEVICE_3',
        status: 'active',
        buildingId: building[1].id,
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
        address: buildingAddresses[i % 2], // Alternate between building addresses
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
    try {
      await prisma.cost.create({
        data: {
          userId: tenant.id,
          pvCost: parseFloat(pvPrice),
          gridCost: parseFloat(gridPrice),
          baseFee: parseFloat(baseFee),
          currency: 'EUR',
        },
      })
    } catch (error) {
      // Skip if cost record already exists for this tenant
      console.log(`Cost record already exists for tenant ${tenant.id}`)
    }
  }

  // 9. Seed consumption and PV generation from hackathon dataset
  const datasetPath = path.join(__dirname, 'data', 'hackathon_dataset_prepared_CORRECTED.csv')
  const datasetData = fs.readFileSync(datasetPath, 'utf-8')
  const datasetLines = datasetData.split('\n').filter(line => line.trim()).slice(1) // Remove header and empty lines

  console.log(`📊 Processing ${datasetLines.length} rows of energy data...`)

  // Prepare batch arrays with proper types
  interface ConsumptionRecord {
    timestamp: Date
    consumptionKwh: number
    userId: string
  }

  interface PvGenerationRecord {
    timestamp: Date
    generationKwh: number
    deviceId: string
  }

  const consumptionRecords: ConsumptionRecord[] = []
  const pvGenerationRecords: PvGenerationRecord[] = []

  // Helper function to safely parse float and check for NaN
  const safeParseFloat = (value: string): number | null => {
    if (!value || value.trim() === '' || value.toLowerCase() === 'nan') {
      return null
    }
    const parsed = parseFloat(value.trim())
    return isNaN(parsed) ? null : parsed
  }

  // Process each line and collect records
  for (const line of datasetLines) {
    const [timestamp, we1Consumption, we2Consumption, generalConsumption, , pvGeneration] = line.split(',').map(field => field.trim())

    if (!timestamp) continue

    const parsedTimestamp = new Date(timestamp)

    // Skip invalid timestamps
    if (isNaN(parsedTimestamp.getTime())) continue

    // Add consumption records with NaN validation
    const we1Value = safeParseFloat(we1Consumption)
    if (we1Value && we1Value > 0) {
      consumptionRecords.push({
        timestamp: parsedTimestamp,
        consumptionKwh: we1Value,
        userId: tenants[0].id,
      })
    }

    const we2Value = safeParseFloat(we2Consumption)
    if (we2Value && we2Value > 0) {
      consumptionRecords.push({
        timestamp: parsedTimestamp,
        consumptionKwh: we2Value,
        userId: tenants[1] ? tenants[1].id : tenants[0].id,
      })
    }

    const generalValue = safeParseFloat(generalConsumption)
    if (generalValue && generalValue > 0) {
      consumptionRecords.push({
        timestamp: parsedTimestamp,
        consumptionKwh: generalValue,
        userId: landlord.id,
      })
    }

    // Add PV generation records with NaN validation
    const pvValue = safeParseFloat(pvGeneration)
    if (pvValue && pvValue > 0) {
      // Split generation between devices
      pvGenerationRecords.push({
        timestamp: parsedTimestamp,
        generationKwh: pvValue * 0.6,
        deviceId: devices[0].id,
      })

      pvGenerationRecords.push({
        timestamp: parsedTimestamp,
        generationKwh: pvValue * 0.4,
        deviceId: devices[1].id,
      })
    }
  }

  // Batch insert consumption records
  console.log(`💾 Inserting ${consumptionRecords.length} consumption records...`)
  if (consumptionRecords.length > 0) {
    await prisma.consumption.createMany({
      data: consumptionRecords,
      skipDuplicates: true
    })
  }

  // Batch insert PV generation records
  console.log(`☀️ Inserting ${pvGenerationRecords.length} PV generation records...`)
  if (pvGenerationRecords.length > 0) {
    await prisma.pvGeneration.createMany({
      data: pvGenerationRecords,
      skipDuplicates: true
    })
  }

  console.log(`✅ Seeded ${tenants.length} tenants, 1 landlord, 1 building, ${providers.length} providers, ${devices.length} devices, and consumption/generation data`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})