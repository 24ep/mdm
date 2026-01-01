
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true }
        })

        let output = 'USERS:\n'
        users.forEach(u => output += `- ${u.id} (${u.email})\n`)

        const spaces = await prisma.space.findMany({
            select: { id: true, name: true, createdBy: true }
        })

        output += '\nSPACES:\n'
        spaces.forEach(s => output += `- ${s.id} "${s.name}" (Owner: ${s.createdBy})\n`)

        const pwas = await prisma.websitePWA.findMany({
            select: { id: true, name: true, createdBy: true, spaceId: true }
        })

        output += '\nPWAS:\n'
        pwas.forEach(p => output += `- ${p.id} "${p.name}" (Creator: ${p.createdBy}, Space: ${p.spaceId})\n`)

        fs.writeFileSync('scripts/debug_output.txt', output)
        console.log('Written to scripts/debug_output.txt')

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
