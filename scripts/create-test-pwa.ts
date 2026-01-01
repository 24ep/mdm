
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    try {
        // 1. Create a User (if not exists, though we usually have one from seed)
        const user = await prisma.user.findFirst()
        if (!user) {
            console.log('No user found to assign PWA to.')
            return
        }

        // 2. Check/Create PWA
        let pwa = await prisma.websitePWA.findFirst({
            where: { name: 'Test PWA Studio App' }
        })

        if (!pwa) {
            console.log('Creating new WebsitePWA...')
            pwa = await prisma.websitePWA.create({
                data: {
                    name: 'Test PWA Studio App',
                    description: 'A test PWA for embedding verification',
                    url: 'http://localhost:3002',
                    startUrl: '/',
                    scope: '/',
                    displayMode: 'standalone',
                    orientation: 'any',
                    themeColor: '#000000',
                    bgColor: '#ffffff',
                    installMode: 'browser',
                    createdBy: user.id
                }
            })
        }

        console.log('PWA_ID:' + pwa.id)
        fs.writeFileSync('scripts/pwa-id.txt', pwa.id)

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
