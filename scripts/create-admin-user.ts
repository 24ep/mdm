
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@example.com'
    const password = 'password123'
    const name = 'Admin User'

    console.log(`Checking if user ${email} exists...`)

    const existing = await prisma.user.findUnique({
        where: { email }
    })

    if (existing) {
        console.log(`User ${email} already exists. Updating password...`)
        const hashedPassword = await bcrypt.hash(password, 12)
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                role: 'ADMIN' // Ensure admin role
            }
        })
        console.log('Password updated and role set to ADMIN.')
    } else {
        console.log(`Creating new user ${email}...`)
        const hashedPassword = await bcrypt.hash(password, 12)
        await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'ADMIN'
            }
        })
        console.log('User created successfully.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
