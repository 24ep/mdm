
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    const projects = await prisma.project.findMany()
    const output = projects.map(p => `${p.id} - ${p.name}`).join('\n')
    fs.writeFileSync('projects.txt', output)
    console.log('Projects saved to projects.txt')
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
