import { PrismaClient, UserRole, Gender } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting comprehensive database seed from current state...')

    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await prisma.programmeHabit.deleteMany({})
    await prisma.programmeEnrolment.deleteMany({})
    await prisma.programme.deleteMany({})
    await prisma.programmeTemplate.deleteMany({})
    await prisma.habit.deleteMany({})
    await prisma.client.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.account.deleteMany({})
    await prisma.verificationToken.deleteMany({})


    console.log('✅ Existing data cleared')

    // Create users and clients from current database state
    console.log('👥 Creating users and clients...')

    // Special admin users
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
            roles: [UserRole.SystemAdmin, UserRole.Admin],
            authId: 'admin_user_001',
        }
    })

    const businessOwnerUser = await prisma.user.create({
        data: {
            id: 'owner_user_001',
            name: 'Business Owner',
            email: 'owner@benefit.com',
            emailVerified: new Date(),
        }
    })

    const businessOwnerClient = await prisma.client.create({
        data: {
            id: 'owner_user_001',
            firstName: 'Business',
            lastName: 'Owner',
            current: true,
            disabled: false,
            roles: [UserRole.Admin],
            authId: 'owner_user_001',
        }
    })

    // Brent Edwards user
    const brentUser = await prisma.user.create({
        data: {
            id: 'brent_user_001',
            name: 'Brent Edwards',
            email: 'brentedwards.nz@gmail.com',
            emailVerified: new Date(),
        }
    })

    const brentClient = await prisma.client.create({
        data: {
            id: 'brent_user_001',
            firstName: 'Brent',
            lastName: 'Edwards',
            current: true,
            disabled: false,
            roles: [UserRole.SystemAdmin, UserRole.Admin, UserRole.Client],
            authId: 'brent_user_001',
        }
    })

    // Create regular client users (53 clients from the current database)
    const clientNames = [
        { firstName: 'Michael', lastName: 'Smith', email: 'michael.smith@email.com' },
        { firstName: 'Emily', lastName: 'Johnson', email: 'emily.johnson@email.com' },
        { firstName: 'David', lastName: 'Williams', email: 'david.williams@email.com' },
        { firstName: 'Olivia', lastName: 'Brown', email: 'olivia.brown@email.com' },
        { firstName: 'Daniel', lastName: 'Jones', email: 'daniel.jones@email.com' },
        { firstName: 'Sophia', lastName: 'Garcia', email: 'sophia.garcia@email.com' },
        { firstName: 'Matthew', lastName: 'Rodriguez', email: 'matthew.rodriguez@email.com' },
        { firstName: 'Isabella', lastName: 'Martinez', email: 'isabella.martinez@email.com' },
        { firstName: 'Christopher', lastName: 'Hernandez', email: 'christopher.hernandez@email.com' },
        { firstName: 'Mia', lastName: 'Lopez', email: 'mia.lopez@email.com' },
        { firstName: 'Andrew', lastName: 'Perez', email: 'andrew.perez@email.com' },
        { firstName: 'Charlotte', lastName: 'Gonzalez', email: 'charlotte.gonzalez@email.com' },
        { firstName: 'Joseph', lastName: 'Wilson', email: 'joseph.wilson@email.com' },
        { firstName: 'Amelia', lastName: 'Anderson', email: 'amelia.anderson@email.com' },
        { firstName: 'Thomas', lastName: 'Taylor', email: 'thomas.taylor@email.com' },
        { firstName: 'Ella', lastName: 'Thomas', email: 'ella.thomas@email.com' },
        { firstName: 'James', lastName: 'Moore', email: 'james.moore@email.com' },
        { firstName: 'Chloe', lastName: 'White', email: 'chloe.white@email.com' },
        { firstName: 'Robert', lastName: 'Clark', email: 'robert.clark@email.com' },
        { firstName: 'Sophie', lastName: 'Lewis', email: 'sophie.lewis@email.com' },
        { firstName: 'William', lastName: 'Hall', email: 'william.hall@email.com' },
        { firstName: 'Zoe', lastName: 'Young', email: 'zoe.young@email.com' },
        { firstName: 'Richard', lastName: 'King', email: 'richard.king@email.com' },
        { firstName: 'Lily', lastName: 'Scott', email: 'lily.scott@email.com' },
        { firstName: 'Paul', lastName: 'Green', email: 'paul.green@email.com' },
        { firstName: 'Hannah', lastName: 'Adams', email: 'hannah.adams@email.com' },
        { firstName: 'Steven', lastName: 'Baker', email: 'steven.baker@email.com' },
        { firstName: 'Grace', lastName: 'Nelson', email: 'grace.nelson@email.com' },
        { firstName: 'Kevin', lastName: 'Carter', email: 'kevin.carter@email.com' },
        { firstName: 'Victoria', lastName: 'Mitchell', email: 'victoria.mitchell@email.com' },
        { firstName: 'Justin', lastName: 'Roberts', email: 'justin.roberts@email.com' },
        { firstName: 'Megan', lastName: 'Parker', email: 'megan.parker@email.com' },
        { firstName: 'Scott', lastName: 'Davis', email: 'scott.davis@email.com' },
        { firstName: 'Lauren', lastName: 'Collins', email: 'lauren.collins@email.com' },
        { firstName: 'Ryan', lastName: 'Stewart', email: 'ryan.stewart@email.com' },
        { firstName: 'Julia', lastName: 'Morris', email: 'julia.morris@email.com' },
        { firstName: 'Nicholas', lastName: 'Rogers', email: 'nicholas.rogers@email.com' },
        { firstName: 'Natalie', lastName: 'Evans', email: 'natalie.evans@email.com' },
        { firstName: 'Jason', lastName: 'Cooper', email: 'jason.cooper@email.com' },
        { firstName: 'Samantha', lastName: 'Peterson', email: 'samantha.peterson@email.com' },
        { firstName: 'Kevin', lastName: 'Ramirez', email: 'kevin.ramirez@email.com' },
        { firstName: 'Ashley', lastName: 'Cox', email: 'ashley.cox@email.com' },
        { firstName: 'Joshua', lastName: 'Ward', email: 'joshua.ward@email.com' },
        { firstName: 'Kayla', lastName: 'Phillips', email: 'kayla.phillips@email.com' },
        { firstName: 'Mark', lastName: 'Bell', email: 'mark.bell@email.com' },
        { firstName: 'Jessica', lastName: 'Ramirez', email: 'jessica.ramirez@email.com' },
        { firstName: 'Brian', lastName: 'Flores', email: 'brian.flores@email.com' },
        { firstName: 'Nicole', lastName: 'Rivera', email: 'nicole.rivera@email.com' },
        { firstName: 'Timothy', lastName: 'Morris', email: 'timothy.morris@email.com' },
        { firstName: 'Stephanie', lastName: 'Sanchez', email: 'stephanie.sanchez@email.com' },
        { firstName: 'Patrick', lastName: 'Hughes', email: 'patrick.hughes@email.com' },
        { firstName: 'Melissa', lastName: 'Reed', email: 'melissa.reed@email.com' },
    ]

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < clientNames.length; i++) {
        const clientRecord = clientNames[i]

        try {
            const authId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Create NextAuth User record
            const user = await prisma.user.create({
                data: {
                    id: authId,
                    name: `${clientRecord.firstName} ${clientRecord.lastName}`,
                    email: clientRecord.email,
                    image: null,
                    emailVerified: new Date(),
                }
            })

            // Create Client record linked to the user
            const client = await prisma.client.create({
                data: {
                    id: authId,
                    firstName: clientRecord.firstName,
                    lastName: clientRecord.lastName,
                    birthDate: null,
                    gender: null,
                    current: true,
                    disabled: false,
                    avatarUrl: null,
                    contactInfo: [
                        {
                            type: "email",
                            value: clientRecord.email,
                            primary: true,
                            label: "Primary Email"
                        }
                    ],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    roles: [UserRole.Client],
                    authId: authId,
                }
            })

            successCount++

        } catch (error) {
            errorCount++
            console.error(`❌ Error processing client ${i + 1} (${clientRecord.firstName} ${clientRecord.lastName}):`, error)
            continue
        }
    }

    // Create programme templates
    console.log('\n📚 Creating programme templates...')

    const wellnessTemplate = await prisma.programmeTemplate.create({
        data: {
            id: 'wellness_template_001',
            name: 'Wellness Program',
            maxClients: 20,
            programmeCost: 299.99,
            notes: 'Comprehensive wellness program for general health improvement',
            adhocData: {},
            sessionsDescription: {
                sessions: [
                    { week: 1, title: 'Introduction to Wellness', duration: '60 minutes' },
                    { week: 2, title: 'Nutrition Basics', duration: '60 minutes' },
                    { week: 3, title: 'Exercise Fundamentals', duration: '60 minutes' },
                    { week: 4, title: 'Mental Health & Stress Management', duration: '60 minutes' },
                    { week: 5, title: 'Sleep & Recovery', duration: '60 minutes' },
                    { week: 6, title: 'Long-term Wellness Planning', duration: '60 minutes' }
                ]
            }
        }
    })

    const fitnessTemplate = await prisma.programmeTemplate.create({
        data: {
            id: 'fitness_template_001',
            name: 'Fitness & Strength Training',
            maxClients: 15,
            programmeCost: 399.99,
            notes: 'Intensive fitness program focused on strength and conditioning',
            adhocData: {},
            sessionsDescription: {
                sessions: [
                    { week: 1, title: 'Fitness Assessment', duration: '90 minutes' },
                    { week: 2, title: 'Strength Training Basics', duration: '75 minutes' },
                    { week: 3, title: 'Cardio & Endurance', duration: '75 minutes' },
                    { week: 4, title: 'Advanced Strength', duration: '75 minutes' },
                    { week: 5, title: 'Recovery & Flexibility', duration: '60 minutes' },
                    { week: 6, title: 'Performance Testing', duration: '90 minutes' }
                ]
            }
        }
    })

    // Create programmes
    console.log('\n🏃 Creating programmes...')

    const wellnessProgramme = await prisma.programme.create({
        data: {
            id: 'wellness_programme_001',
            programmeTemplateId: wellnessTemplate.id,
            humanReadableId: 'WELL-2024-001',
            name: 'Wellness Program 2024',
            startDate: new Date('2024-01-15'),
            maxClients: 20,
            programmeCost: 299.99,
            notes: 'Spring 2024 wellness program',
            adhocData: {},
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            sessionsDescription: wellnessTemplate.sessionsDescription as any
        }
    })

    const fitnessProgramme = await prisma.programme.create({
        data: {
            id: 'fitness_programme_001',
            programmeTemplateId: fitnessTemplate.id,
            humanReadableId: 'FIT-2024-001',
            name: 'Fitness & Strength Training 2024',
            startDate: new Date('2024-02-01'),
            maxClients: 15,
            programmeCost: 399.99,
            notes: 'Winter 2024 fitness program',
            adhocData: {},
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            sessionsDescription: fitnessTemplate.sessionsDescription as any
        }
    })



    // Create programme enrolment
    console.log('\n📝 Creating programme enrolment...')

    const enrolment = await prisma.programmeEnrolment.create({
        data: {
            id: 'enrolment_001',
            programId: wellnessProgramme.id,
            clientId: brentClient.id,
            notes: 'Brent enrolled in wellness program',
            adhocData: {},
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            programmeTemplateId: wellnessTemplate.id
        }
    })



    // Create habits
    console.log('\n💪 Creating wellness habits...')

    const habitsData = [
        {
            title: "Physical Activity",
            notes: "Engage in moderate-intensity aerobic activity for 30 minutes per session.",
            frequencyPerWeek: { per_week: 5, per_day: null },
            frequencyPerDay: null
        },
        {
            title: "Balanced Nutrition",
            notes: "Eat a balanced combination of macronutrients and micronutrients, including at least 2 servings of fruits and vegetables at each meal.",
            frequencyPerWeek: { per_week: "Every day", per_day: 3 },
            frequencyPerDay: 3
        },
        {
            title: "Adequate Sleep",
            notes: "Aim to get 7 to 9 hours of sleep per night.",
            frequencyPerWeek: { per_week: "Every day", per_day: null },
            frequencyPerDay: null
        },
        {
            title: "Hydration",
            notes: "Drink 600 ml of water per session.",
            frequencyPerWeek: { per_week: "Every day", per_day: 5 },
            frequencyPerDay: 5
        },
        {
            title: "Stress Management and Mindfulness",
            notes: "Practice mindfulness or meditation for 10 minutes per session.",
            frequencyPerWeek: { per_week: "Every day", per_day: null },
            frequencyPerDay: null
        },
        {
            title: "Strength Training",
            notes: "Complete a workout that targets all major muscle groups.",
            frequencyPerWeek: { per_week: 2, per_day: null },
            frequencyPerDay: null
        },
        {
            title: "Regular Stretching and Flexibility",
            notes: "Dedicate 10-15 minutes to stretching major muscle groups.",
            frequencyPerWeek: { per_week: 5, per_day: null },
            frequencyPerDay: null
        },
        {
            title: "Conscious Eating",
            notes: "Pay attention to your food without distraction for the duration of a meal.",
            frequencyPerWeek: { per_week: "Every day", per_day: null },
            frequencyPerDay: null
        },
        {
            title: "Digital Detox / Limiting Screen Time",
            notes: "Take a break from screens for 10-15 minutes every few hours and avoid using them for at least 60 minutes before bed.",
            frequencyPerWeek: { per_week: "Every day", per_day: 5 },
            frequencyPerDay: 5
        },
        {
            title: "Practicing Gratitude",
            notes: "Spend just 5 minutes to write down or reflect on three things you are grateful for.",
            frequencyPerWeek: { per_week: "Every day", per_day: null },
            frequencyPerDay: null
        }
    ]

    const createdHabits = []
    for (const habitData of habitsData) {
        const habit = await prisma.habit.create({
            data: {
                title: habitData.title,
                notes: habitData.notes,
                frequencyPerWeek: habitData.frequencyPerWeek,
                frequencyPerDay: habitData.frequencyPerDay,
                current: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })
        createdHabits.push(habit)
    }

    // Create programme habits
    console.log('\n🎯 Creating programme habits...')

    // Assign some habits to the wellness programme
    const wellnessHabitTitles = [
        'Physical Activity',
        'Balanced Nutrition',
        'Adequate Sleep',
        'Hydration',
        'Stress Management and Mindfulness'
    ]

    for (let i = 0; i < wellnessHabitTitles.length; i++) {
        const habit = createdHabits.find(h => h.title === wellnessHabitTitles[i])
        if (habit) {
            await prisma.programmeHabit.create({
                data: {
                    programmeId: wellnessProgramme.id,
                    habitId: habit.id,
                    title: habit.title,
                    notes: `Programme-specific version of ${habit.title}`,
                    frequencyPerWeek: { per_week: 5, per_day: null },
                    frequencyPerDay: null,
                    current: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })
        }
    }

    // Assign some habits to the fitness programme
    const fitnessHabitTitles = [
        'Strength Training',
        'Physical Activity',
        'Regular Stretching and Flexibility',
        'Conscious Eating'
    ]

    for (let i = 0; i < fitnessHabitTitles.length; i++) {
        const habit = createdHabits.find(h => h.title === fitnessHabitTitles[i])
        if (habit) {
            await prisma.programmeHabit.create({
                data: {
                    programmeId: fitnessProgramme.id,
                    habitId: habit.id,
                    title: habit.title,
                    notes: `Programme-specific version of ${habit.title}`,
                    frequencyPerWeek: { per_week: 3, per_day: null },
                    frequencyPerDay: null,
                    current: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })
        }
    }

    console.log('\n🎉 Seeding completed!')
    console.log(`✅ Successfully seeded: ${successCount} regular clients`)
    console.log('✅ Special users created:')
    console.log('  - System Administrator (SystemAdmin, Admin)')
    console.log('  - Business Owner (Admin)')
    console.log('  - Brent Edwards (SystemAdmin, Admin, Client)')
    console.log('✅ Programme templates created: 2')
    console.log('✅ Programmes created: 2')
    console.log('✅ Programme habits created: 9')
    console.log('✅ Programme enrolment created: 1')

    console.log(`✅ Wellness habits created: ${createdHabits.length}`)

    console.log('\n🔑 Test Login Credentials:')
    console.log('System Admin: brentedwards.nz@gmail.com')
    console.log('Admin: admin@benefit.com')
    console.log('Business Owner: owner@benefit.com')
    console.log('Note: These are seeded users - you may need to set up proper authentication')

    console.log('\n📊 Final Database Summary:')
    const totalUsers = await prisma.user.count()
    const totalClients = await prisma.client.count()
    const totalProgrammes = await prisma.programme.count()
    const totalTemplates = await prisma.programmeTemplate.count()
    const totalEnrolments = await prisma.programmeEnrolment.count()
    const totalProgrammeHabits = await prisma.programmeHabit.count()

    const totalHabits = await prisma.habit.count()

    console.log(`Total Users: ${totalUsers}`)
    console.log(`Total Clients: ${totalClients}`)
    console.log(`Total Programmes: ${totalProgrammes}`)
    console.log(`Total Templates: ${totalTemplates}`)
    console.log(`Total Enrolments: ${totalEnrolments}`)
    console.log(`Total Programme Habits: ${totalProgrammeHabits}`)

    console.log(`Total Habits: ${totalHabits}`)
}

main()
    .catch((e) => {
        console.error('❌ Fatal error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
