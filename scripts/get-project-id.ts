
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const project = await prisma.project.findFirst()
    if (project) {
        console.log(`Found Project ID: ${project.id}`)
    } else {
        // Need a space first
        const space = await prisma.space.findFirst()
        const user = await prisma.user.findFirst()

        if (space && user) {
            const newProject = await prisma.project.create({
                data: {
                    name: "Test Project",
                    spaceId: space.id,
                    createdBy: user.id
                }
            })
            console.log(`Created Project ID: ${newProject.id}`)
        } else {
            console.log("Creating new user and space...")
            const newUser = await prisma.user.create({
                data: {
                    email: `test-${Date.now()}@example.com`,
                    name: "Test User",
                    password: "password123"
                }
            })
            const newSpace = await prisma.space.create({
                data: {
                    name: "Test Space",
                    slug: `test-space-${Date.now()}`,
                    createdBy: newUser.id,
                    members: {
                        create: {
                            userId: newUser.id,
                            role: 'OWNER'
                        }
                    }
                }
            })
            const newProject = await prisma.project.create({
                data: {
                    name: "Test Project",
                    spaceId: newSpace.id,
                    createdBy: newUser.id
                }
            })
            console.log(`Created Project ID: ${newProject.id}`)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
