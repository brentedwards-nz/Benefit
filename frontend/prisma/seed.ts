import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Create a sample client with multiple roles
    console.log('Creating sample client with multiple roles...')
    const client = await prisma.client.upsert({
        where: { auth_id: '550e8400-e29b-41d4-a716-446655440000' },
        update: {},
        create: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            auth_id: '550e8400-e29b-41d4-a716-446655440000',
            first_name: 'John',
            last_name: 'Doe',
            current: true,
            disabled: false,
            roles: [UserRole.Client, UserRole.Admin], // Multiple roles
        },
    })

    // Create another client with different roles
    const adminClient = await prisma.client.upsert({
        where: { auth_id: '550e8400-e29b-41d4-a716-446655440001' },
        update: {},
        create: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            auth_id: '550e8400-e29b-41d4-a716-446655440001',
            first_name: 'Jane',
            last_name: 'Smith',
            current: true,
            disabled: false,
            roles: [UserRole.Admin, UserRole.Owner], // Multiple roles
        },
    })

    console.log('✅ Database seeded successfully!')
    console.log('Sample clients created:')
    console.log('- John Doe with roles: Client, Admin')
    console.log('- Jane Smith with roles: Admin, Owner')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
