import { PrismaClient, UserRole, Gender } from '@prisma/client'
import clientData from './seed/client.json'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting comprehensive database seed...')
    console.log(`📊 Found ${clientData.length} clients to seed`)

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing clients and users...')
    await prisma.client.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.account.deleteMany({})
    await prisma.verificationToken.deleteMany({})

    console.log('✅ Existing data cleared')

    let successCount = 0
    let errorCount = 0

    // Process each client from the JSON file
    for (let i = 0; i < clientData.length; i++) {
        const clientRecord = clientData[i]

        try {
            // Generate a unique authId (using cuid-like format)
            const authId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Create NextAuth User record
            const user = await prisma.user.create({
                data: {
                    id: authId,
                    name: `${clientRecord.firstName} ${clientRecord.lastName}`,
                    email: clientRecord.contactInfo?.find((c: any) => c.type === 'email' && c.primary)?.value || `client${i + 1}@example.com`,
                    image: clientRecord.avatarUrl,
                    emailVerified: new Date(), // Mark as verified for seeded users
                }
            })

            // Create Client record linked to the user
            const client = await prisma.client.create({
                data: {
                    id: authId, // Use the same ID as the user
                    firstName: clientRecord.firstName,
                    lastName: clientRecord.lastName,
                    birthDate: clientRecord.birthDate ? new Date(clientRecord.birthDate) : null,
                    gender: clientRecord.gender as Gender || null,
                    current: clientRecord.current ?? true,
                    disabled: clientRecord.disabled ?? false,
                    avatarUrl: clientRecord.avatarUrl,
                    contactInfo: clientRecord.contactInfo || [],
                    createdAt: clientRecord.createdAt ? new Date(clientRecord.createdAt) : new Date(),
                    updatedAt: clientRecord.updatedAt ? new Date(clientRecord.updatedAt) : new Date(),
                    roles: clientRecord.roles?.map((role: string) => role as UserRole) || [UserRole.Client],
                    authId: authId,
                }
            })

            successCount++

            // Log progress every 100 records
            if (successCount % 100 === 0) {
                console.log(`✅ Processed ${successCount}/${clientData.length} clients...`)
            }

        } catch (error) {
            errorCount++
            console.error(`❌ Error processing client ${i + 1} (${clientRecord.firstName} ${clientRecord.lastName}):`, error)

            // Continue with next client instead of failing completely
            continue
        }
    }

    console.log('\n🎉 Seeding completed!')
    console.log(`✅ Successfully seeded: ${successCount} clients`)
    if (errorCount > 0) {
        console.log(`❌ Errors encountered: ${errorCount} clients`)
    }

    // Create some additional admin users for testing
    console.log('\n👑 Creating admin users...')

    const adminUser = await prisma.user.create({
        data: {
            id: 'admin_user_001',
            name: 'System Administrator',
            email: 'admin@benefit.com',
            emailVerified: new Date(),
        }
    })

    const adminClient = await prisma.client.create({
        data: {
            id: 'admin_user_001',
            firstName: 'System',
            lastName: 'Administrator',
            current: true,
            disabled: false,
            roles: [UserRole.SystemAdmin, UserRole.Owner],
            authId: 'admin_user_001',
        }
    })

    console.log('✅ Admin user created: System Administrator')

    // Create a test owner user
    const ownerUser = await prisma.user.create({
        data: {
            id: 'owner_user_001',
            name: 'Business Owner',
            email: 'owner@benefit.com',
            emailVerified: new Date(),
        }
    })

    const ownerClient = await prisma.client.create({
        data: {
            id: 'owner_user_001',
            firstName: 'Business',
            lastName: 'Owner',
            current: true,
            disabled: false,
            roles: [UserRole.Owner, UserRole.Admin],
            authId: 'owner_user_001',
        }
    })

    console.log('✅ Owner user created: Business Owner')

    console.log('\n🔑 Test Login Credentials:')
    console.log('Admin: admin@benefit.com')
    console.log('Owner: owner@benefit.com')
    console.log('Note: These are seeded users - you may need to set up proper authentication')

    console.log('\n📊 Final Database Summary:')
    const totalUsers = await prisma.user.count()
    const totalClients = await prisma.client.count()
    console.log(`Total Users: ${totalUsers}`)
    console.log(`Total Clients: ${totalClients}`)
}

main()
    .catch((e) => {
        console.error('❌ Fatal error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
