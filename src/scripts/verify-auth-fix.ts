
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testAuthQueries() {
    try {
        // 1. Get ANY user ID
        // const email = 'jaroonwitpool@gmail.com' // Removed specific email
        // console.log(`Searching for user: ${email}`) // Removed specific email log

        const users = await prisma.$queryRawUnsafe<any[]>(
            'SELECT id, email, failed_login_attempts FROM public.users LIMIT 1'
        )

        if (!Array.isArray(users) || users.length === 0) {
            console.log('User not found')
            return
        }

        const user = users[0]
        console.log(`Found user: ${user.id} (${typeof user.id})`)

        // 2. Test UPDATE with casting (Simulate failed login attempt update)
        const newAttempts = (user.failed_login_attempts || 0) + 1
        console.log(`Testing UPDATE with id = $2::uuid`)

        // Note: We use executeRawUnsafe for writes usually, but queryRawUnsafe works too for returning rows if needed.
        // Auth.ts uses query() which wraps $queryRawUnsafe.

        await prisma.$queryRawUnsafe(
            'UPDATE public.users SET failed_login_attempts = $1 WHERE id = $2::uuid',
            newAttempts,
            user.id
        )
        console.log('✅ UPDATE 1 (failed_login_attempts) success')

        // 3. Test UPDATE reset
        console.log(`Testing UPDATE reset with id = $1::uuid`)
        await prisma.$queryRawUnsafe(
            'UPDATE public.users SET failed_login_attempts = 0 WHERE id = $1::uuid',
            user.id
        )
        console.log('✅ UPDATE 2 (reset) success')

    } catch (error: any) {
        console.error('❌ Query Failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testAuthQueries()
