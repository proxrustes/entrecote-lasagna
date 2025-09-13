import { PrismaClient, UserRole } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database for RoofShare solar energy app...')

  // Create sample tenants (matching hackathon dataset)
  const tenant1 = await prisma.user.upsert({
    where: { email: 'mieter-eg-rechts@roofshare.de' },
    update: {},
    create: {
      email: 'mieter-eg-rechts@roofshare.de',
      password: 'demo_password_123', // In production, use bcrypt
      role: UserRole.TENANT,
    },
  })

  const tenant2 = await prisma.user.upsert({
    where: { email: 'mieter-eg-links@roofshare.de' },
    update: {},
    create: {
      email: 'mieter-eg-links@roofshare.de',
      password: 'demo_password_456', // In production, use bcrypt
      role: UserRole.TENANT,
    },
  })

  // Create sample landlord
  const landlord = await prisma.user.upsert({
    where: { email: 'vermieter@roofshare.de' },
    update: {},
    create: {
      email: 'vermieter@roofshare.de',
      password: 'demo_password_789', // In production, use bcrypt
      role: UserRole.LANDLORD,
    },
  })

  console.log('✅ Created sample users:')
  console.log(`   👤 Tenant 1: ${tenant1.email}`)
  console.log(`   👤 Tenant 2: ${tenant2.email}`)
  console.log(`   🏠 Landlord: ${landlord.email}`)
  console.log('\n🎉 Database seeding completed!')
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